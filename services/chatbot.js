import chalk from "chalk";

while (true) {
  const userInput = promptSync(chalk.green("You: "));
  if (userInput.toLowerCase() === "exit") {
    process.exit(0);
  }
  const result = await chat.sendMessage(userInput);

  if (result.error) {
    console.error(chalk.red("AI Error:"), result.error.message);
    continue;
  }
  const response = result.response.text();
}
