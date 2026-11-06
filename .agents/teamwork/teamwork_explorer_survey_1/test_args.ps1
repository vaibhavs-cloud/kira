$agent = "kira"
$agentArgs = @("--agent", $agent)
$prompt = "test prompt"
node -e "console.log(JSON.stringify(process.argv.slice(1)))" run --auto @agentArgs $prompt
node -e "console.log(JSON.stringify(process.argv.slice(1)))" run --auto --agent $agent $prompt
