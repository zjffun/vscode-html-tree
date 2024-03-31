import * as vscode from "vscode";
import { HtmlTreeService } from "../HtmlTreeService";
import { log } from "../extension";
import revealItem from "../core/revealItem";
import { getDescription } from "../util";

let htmlTreeView: HtmlTreeView;

export class HtmlTreeItem extends vscode.TreeItem {
  node: any;
  parent: HtmlTreeItem;
  children?: HtmlTreeItem[];

  constructor(node: any, parent?: any) {
    super(node.nodeName);

    this.node = node;
    this.parent = parent;

    this.contextValue = "html-tree-treeView-viewItem";
    this.command = {
      title: "select",
      command: "html-tree.select",
      arguments: [this],
    };

    if (node.nodeName === "#text") {
      this.contextValue = "html-tree-treeView-viewItemText";
      this.description = getDescription(node.value);
    } else if (node.nodeName === "#comment") {
      this.contextValue = "html-tree-treeView-viewItemComment";
      this.description = getDescription(node.data);
    } else {
      this.description = node.attrs?.find(
        (attr: any) => attr.name === "class"
      )?.value;
    }
  }
}

export default class HtmlTreeView
  implements vscode.TreeDataProvider<HtmlTreeItem>
{
  static get singleton() {
    return htmlTreeView;
  }

  public static viewId = "html-tree-treeView";

  public treeView: vscode.TreeView<HtmlTreeItem>;

  protected context: vscode.ExtensionContext;

  protected htmlTree: HtmlTreeItem[] = [];

  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    htmlTreeView = this;

    this.context = context;

    this.treeView = vscode.window.createTreeView(HtmlTreeView.viewId, {
      treeDataProvider: this,
      showCollapseAll: true,
    });

    this.treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        this.refresh();
      }
    });
  }

  public refresh(): any {
    if (!this.treeView.visible) {
      return;
    }

    this._onDidChangeTreeData.fire(null);
    // wait for the tree to be updated
    setTimeout(() => {
      revealItem();
    }, 10);
  }

  public async revealItem(offset: number) {
    const element = this.searchElement(this.htmlTree, offset);

    if (element) {
      await this.treeView.reveal(element);
    }
  }

  private searchElement(
    elements: HtmlTreeItem[] | undefined,
    offset: number
  ): HtmlTreeItem | null {
    if (!elements) {
      return null;
    }

    for (const element of elements) {
      // <div></div>caret<section></section> will return the div
      if (
        element.node.sourceCodeLocation.startOffset <= offset &&
        element.node.sourceCodeLocation.endOffset + 1 >= offset
      ) {
        // <section><div></div>caret</section> will return the div
        const searchResult = this.searchElement(element.children, offset);

        if (searchResult) {
          return searchResult;
        }

        return element;
      }
    }

    return null;
  }

  public getTreeItem(element: HtmlTreeItem): HtmlTreeItem {
    if (element?.children?.length) {
      element.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      element.label += ` (${element.children.length})`;
    }

    return element;
  }

  public async getChildren(element?: HtmlTreeItem) {
    if (!element) {
      const ast = await HtmlTreeService.getAst();
      this.htmlTree = this.generateTree(ast);

      return this.htmlTree;
    }

    return element.children;
  }

  public getParent(element: HtmlTreeItem): vscode.ProviderResult<HtmlTreeItem> {
    return element.parent;
  }

  protected generateTree(ast: any, parent?: HtmlTreeItem) {
    try {
      const items: HtmlTreeItem[] = [];

      if (!ast.childNodes) {
        return [];
      }

      for (const childNode of ast.childNodes) {
        if (childNode.nodeName === "template" && childNode.content.childNodes) {
          childNode.childNodes = childNode.content.childNodes;
        }

        if (childNode.nodeName === "#text") {
          const content = childNode.value;
          if (!content?.trim()) {
            continue;
          }
        }

        if (
          childNode?.sourceCodeLocation?.startOffset === undefined ||
          childNode?.sourceCodeLocation?.endOffset === undefined
        ) {
          continue;
        }

        const el = new HtmlTreeItem(childNode, parent);
        el.children = this.generateTree(childNode, el);

        items.push(el);
      }

      return items;
    } catch (e: any) {
      log.appendLine(e.message);
    }

    return [];
  }
}
