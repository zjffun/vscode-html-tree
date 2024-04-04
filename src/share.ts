import * as vscode from "vscode";

export let context: vscode.ExtensionContext;

export const setContext = (c: vscode.ExtensionContext) => (context = c);

export const textNodeNames = ["#text", "#comment"];

export const descriptionAttrNames = ["id", "class"];
