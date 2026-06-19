import type { LanguageHint } from "../../types/ai";

export interface ExamplePreset {
  id: string;
  label: string;
  description?: string;
  languageHint: LanguageHint;
  errorText: string;
  contextText?: string;
}

// Set of presets per language

export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    id: "python-basic-traceback",
    label: "Python Traceback",
    description: "Simple Python ZeroDivisionError traceback",
    languageHint: "python",
    errorText: [
      "Traceback (most recent call last):",
      '  File "main.py", line 5, in <module>',
      "    result = divide(10, 0)",
      '  File "main.py", line 2, in divide',
      "    return a / b",
      "ZeroDivisionError: division by zero",
    ].join("\n"),
    contextText: [
      "def divide(a, b):",
      "    return a / b",
      "",
      "result = divide(10, 0)",
    ].join("\n"),
  },
  {
    id: "js-typeerror-undefined",
    label: "JavaScript TypeError",
    description: "Classic 'Cannot read properties of undefined'",
    languageHint: "javascript",
    errorText:
      "TypeError: Cannot read properties of undefined (reading 'name')",
    contextText: ["const user = undefined;", "console.log(user.name);"].join(
      "\n",
    ),
  },
  {
    id: "java-nullpointer-stacktrace",
    label: "Java NullPointerException",
    description: "Basic Java NullPointerException stacktrace",
    languageHint: "java",
    errorText: [
      'Exception in thread "main" java.lang.NullPointerException: Cannot invoke "User.getName()" because "user" is null',
      "\tat com.example.Main.main(Main.java:12)",
    ].join("\n"),
    contextText: [
      "public class Main {",
      "    public static void main(String[] args) {",
      "        User user = null;",
      "        System.out.println(user.getName());",
      "    }",
      "}",
    ].join("\n"),
  },
  {
    id: "generic-cli-error",
    label: "Generic CLI Error",
    description: "Generic example for unknown language / CLI tools",
    languageHint: "auto",
    errorText: [
      "Error: failed to connect to database",
      "Caused by: timeout while contacting 127.0.0.1:5432",
    ].join("\n"),
    contextText: "service start --env=local",
  },
];
