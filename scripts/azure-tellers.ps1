# Zet in Azure alles klaar voor de anonieme tellen (#19), zonder sleutels of geheimen. Draai dit zelf
# na az login, want daar is MFA voor nodig, en na gh auth login:
#   powershell -File scripts/azure-tellers.ps1
# Het script kun je opnieuw draaien: wat er al is, slaat het over.
# - Een storage account in West-Europa met twee tabellen: tellers voor wiskundefit.nl en tellersdev
#   voor previews. Inloggen met een sleutel (shared key) staat uit.
# - Een Function App op Flex Consumption voor /api/tel, met een managed identity die alleen rijen
#   mag toevoegen. Zonder Application Insights.
# - Een identity voor GitHub Actions, die met OIDC inlogt vanaf main: die zet de functie online en
#   mag de tabellen lezen en opruimen voor de wekelijkse optelling. De ids komen als variabelen in
#   GitHub. Dat zijn geen geheimen.
param(
  [string]$Groep = 'rg-we-wiskundefit-prd',
  [string]$Account = 'stwewiskundefitprd',
  [string]$Functie = 'func-we-wiskundefit-prd',
  [string]$Github = 'id-we-wiskundefit-github',
  [string]$Repo = 'angrymrt/wiskunde-fit'
)
# Niet 'Stop': in PowerShell 5.1 wordt elke regel die az naar stderr schrijft dan een fout, ook een
# waarschuwing. Check controleert daarom na elke stap de exitcode van az.
$ErrorActionPreference = 'Continue'
function Check($wat) { if ($LASTEXITCODE -ne 0) { throw "Mislukt: $wat" } }
function Bestaat { & az @args --only-show-errors -o tsv 2>$null; $global:LASTEXITCODE = 0 }
# Een rol toewijzen, als die er nog niet is. Een nieuwe identity of rol is soms nog niet overal
# bekend, dus probeer het een paar keer. Geen haakjes in een --query: az.cmd is een batchbestand,
# en cmd leest die als eigen syntax.
function Rol($principal, $rol, $scope) {
  $er = az role assignment list --assignee $principal --role $rol --scope $scope --query '[].id' -o tsv
  Check "rollen op $scope lezen"
  if ($er) { return }
  for ($i = 1; ; $i++) {
    az role assignment create --assignee-object-id $principal --assignee-principal-type ServicePrincipal `
      --role $rol --scope $scope --only-show-errors -o none
    if ($LASTEXITCODE -eq 0) { return }
    if ($i -ge 6) { throw "Mislukt: rol $rol op $scope" }
    Start-Sleep -Seconds 20
  }
}

$sub = az account show --query id -o tsv
Check 'az login'
$tenant = az account show --query tenantId -o tsv
$rg = "/subscriptions/$sub/resourceGroups/$Groep"
$acc = "$rg/providers/Microsoft.Storage/storageAccounts/$Account"
$tabellen = @('tellers', 'tellersdev') | ForEach-Object { "$acc/tableServices/default/tables/$_" }

Write-Host 'Storage account en tabellen'
if (-not (Bestaat storage account show --name $Account --resource-group $Groep --query name)) {
  az storage account create --name $Account --resource-group $Groep --location westeurope `
    --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 `
    --allow-blob-public-access false --https-only true -o none
  Check 'storage account maken'
}
foreach ($tabel in $tabellen) {
  az rest --method put --uri "https://management.azure.com${tabel}?api-version=2023-05-01" --body '{}' -o none
  Check "tabel $tabel maken"
}

Write-Host 'Function App'
if (-not (Bestaat functionapp show --name $Functie --resource-group $Groep --query name)) {
  az functionapp create --name $Functie --resource-group $Groep --storage-account $Account `
    --flexconsumption-location westeurope --runtime node --runtime-version 22 --instance-memory 512 `
    --deployment-storage-auth-type SystemAssignedIdentity --disable-app-insights -o none
  Check 'Function App maken'
}
az functionapp identity assign --name $Functie --resource-group $Groep -o none
Check 'managed identity van de Function App'
$functieId = az functionapp identity show --name $Functie --resource-group $Groep --query principalId -o tsv

# Een eigen rol die alleen rijen mag toevoegen. De ingebouwde rollen mogen ook lezen en verwijderen.
$rolNaam = 'Wiskundefit tel toevoegen'
if (-not (Bestaat role definition list --name $rolNaam --query '[0].roleName')) {
  $definitie = Join-Path ([IO.Path]::GetTempPath()) 'wiskundefit-rol.json'
  [IO.File]::WriteAllText($definitie, (@{
        Name             = $rolNaam
        IsCustom         = $true
        Description      = 'Mag alleen rijen toevoegen aan een tabel, voor de anonieme tellen van Wiskundefit.'
        Actions          = @()
        DataActions      = @('Microsoft.Storage/storageAccounts/tableServices/tables/entities/add/action')
        NotDataActions   = @()
        AssignableScopes = @($acc)
      } | ConvertTo-Json -Depth 3))
  az role definition create --role-definition "@$definitie" -o none
  Check 'rol maken'
  Remove-Item $definitie
}
foreach ($tabel in $tabellen) { Rol $functieId $rolNaam $tabel }
# De Function App bewaart zijn eigen gegevens en zijn code in blobs in hetzelfde storage account.
Rol $functieId 'Storage Blob Data Owner' $acc

$tabelAdres = "https://$Account.table.core.windows.net"
az functionapp config appsettings set --name $Functie --resource-group $Groep -o none --settings `
  "AzureWebJobsStorage__accountName=$Account" `
  "TELLERS_TABEL=$tabelAdres/tellers" `
  "TELLERS_DEV_TABEL=$tabelAdres/tellersdev"
Check 'settings van de Function App'
# Azure zet bij het maken een verbinding met een sleutel. Die is niet meer nodig.
az functionapp config appsettings delete --name $Functie --resource-group $Groep `
  --setting-names AzureWebJobsStorage DEPLOYMENT_STORAGE_CONNECTION_STRING -o none
Check 'oude verbinding met een sleutel weghalen'

Write-Host 'Identity voor GitHub Actions'
if (-not (Bestaat identity show --name $Github --resource-group $Groep --query name)) {
  az identity create --name $Github --resource-group $Groep --location westeurope -o none
  Check 'identity voor GitHub maken'
}
$githubId = az identity show --name $Github --resource-group $Groep --query principalId -o tsv
$githubClient = az identity show --name $Github --resource-group $Groep --query clientId -o tsv
if (-not (Bestaat identity federated-credential show --name github-main --identity-name $Github --resource-group $Groep --query name)) {
  az identity federated-credential create --name github-main --identity-name $Github `
    --resource-group $Groep --issuer 'https://token.actions.githubusercontent.com' `
    --subject "repo:${Repo}:ref:refs/heads/main" --audiences 'api://AzureADTokenExchange' -o none
  Check 'federated credential'
}
Rol $githubId 'Website Contributor' "$rg/providers/Microsoft.Web/sites/$Functie"
foreach ($tabel in $tabellen) { Rol $githubId 'Storage Table Data Contributor' $tabel }

gh variable set AZURE_CLIENT_ID --repo $Repo --body $githubClient
gh variable set AZURE_TENANT_ID --repo $Repo --body $tenant
gh variable set AZURE_SUBSCRIPTION_ID --repo $Repo --body $sub
Check 'variabelen in GitHub'

Write-Host 'Inloggen met een sleutel uitzetten'
az storage account update --name $Account --resource-group $Groep --allow-shared-key-access false -o none
Check 'shared key uitzetten'

$host_ = az functionapp show --name $Functie --resource-group $Groep --query properties.defaultHostName -o tsv
Write-Host "Klaar. De functie staat op https://$host_/api/tel"
Write-Host 'Klopt dat adres niet met TEL_FUNCTIE in src/js/tel.js, pas het daar dan aan.'
