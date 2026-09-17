import {
  callOrReturn,
  getExtensionField,
  mergeAttributes,
  Node,
  type ParentConfig,
} from "@tiptap/core";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  columnResizing,
  deleteCellSelection,
  deleteColumn,
  deleteRow,
  deleteTable,
  fixTables,
  goToNextCell,
  mergeCells,
  setCellAttr,
  splitCell,
  tableEditing,
  toggleHeaderCell,
  toggleHeaderColumn,
  toggleHeaderRow,
} from "@tiptap/pm/tables";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Tables, built directly on prosemirror-tables.
 *
 * @tiptap/pm already depends on prosemirror-tables, so this costs no new
 * package and no lockfile change — which matters more than it sounds, because
 * the alternative (@tiptap/extension-table) would have to be version-locked
 * against the six other @tiptap packages on every upgrade.
 *
 * The schema below is the standard prosemirror-tables one. The parts worth
 * reading are the tableRole declarations: prosemirror-tables finds tables by
 * looking for that field on the node spec, not by node name, so every one of
 * the four nodes must carry it or the editing plugin quietly does nothing.
 */

declare module "@tiptap/core" {
  interface NodeConfig<Options, Storage> {
    /**
     * How prosemirror-tables should treat this node. Surfaced onto the schema
     * by Table's extendNodeSchema, which applies to every node in the editor.
     */
    tableRole?:
      | string
      | ((this: {
          name: string;
          options: Options;
          storage: Storage;
          parent: ParentConfig<NodeConfig<Options, Storage>>["tableRole"];
        }) => string);
  }

  interface Commands<ReturnType> {
    odookrdTable: {
      insertTable: (options?: {
        rows?: number;
        cols?: number;
        withHeaderRow?: boolean;
      }) => ReturnType;
      addColumnBefore: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteColumn: () => ReturnType;
      addRowBefore: () => ReturnType;
      addRowAfter: () => ReturnType;
      deleteRow: () => ReturnType;
      deleteTable: () => ReturnType;
      mergeCells: () => ReturnType;
      splitCell: () => ReturnType;
      mergeOrSplit: () => ReturnType;
      toggleHeaderRow: () => ReturnType;
      toggleHeaderColumn: () => ReturnType;
      toggleHeaderCell: () => ReturnType;
      setCellAttribute: (name: string, value: unknown) => ReturnType;
      goToNextCell: () => ReturnType;
      goToPreviousCell: () => ReturnType;
      fixTables: () => ReturnType;
    };
  }
}

function parseSpan(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseColwidth(value: string | null): number[] | null {
  if (!value) return null;
  const widths = value
    .split(",")
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0);
  return widths.length > 0 ? widths : null;
}

/** colspan/rowspan/colwidth, shared by the two cell nodes. */
function cellAttributes() {
  return {
    colspan: {
      default: 1,
      parseHTML: (element: HTMLElement) =>
        parseSpan(element.getAttribute("colspan")),
      renderHTML: (attributes: Record<string, unknown>) =>
        Number(attributes.colspan) > 1
          ? { colspan: String(attributes.colspan) }
          : {},
    },
    rowspan: {
      default: 1,
      parseHTML: (element: HTMLElement) =>
        parseSpan(element.getAttribute("rowspan")),
      renderHTML: (attributes: Record<string, unknown>) =>
        Number(attributes.rowspan) > 1
          ? { rowspan: String(attributes.rowspan) }
          : {},
    },
    colwidth: {
      default: null,
      parseHTML: (element: HTMLElement) =>
        parseColwidth(element.getAttribute("data-colwidth")),
      renderHTML: (attributes: Record<string, unknown>) =>
        Array.isArray(attributes.colwidth) && attributes.colwidth.length > 0
          ? { "data-colwidth": attributes.colwidth.join(",") }
          : {},
    },
  };
}

/** Builds the node tree for a fresh r x c table. */
function buildTable(
  schema: {
    nodes: Record<string, { createAndFill: () => ProseMirrorNode | null }>;
  },
  rows: number,
  cols: number,
  withHeaderRow: boolean,
): ProseMirrorNode | null {
  const rowNodes: ProseMirrorNode[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const cells: ProseMirrorNode[] = [];
    const cellType =
      withHeaderRow && rowIndex === 0 ? "tableHeader" : "tableCell";

    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const cell = schema.nodes[cellType]?.createAndFill();
      if (cell) cells.push(cell);
    }

    const row = (
      schema.nodes.tableRow as unknown as {
        createChecked: (
          attrs: null,
          content: ProseMirrorNode[],
        ) => ProseMirrorNode;
      }
    ).createChecked(null, cells);
    rowNodes.push(row);
  }

  return (
    schema.nodes.table as unknown as {
      createChecked: (attrs: null, content: ProseMirrorNode[]) => ProseMirrorNode;
    }
  ).createChecked(null, rowNodes);
}

export interface TableOptions {
  /** Minimum width a column can be dragged to, in pixels. */
  cellMinWidth: number;
  /** Width applied to a column the first time it is dragged. */
  defaultCellMinWidth: number;
  resizable: boolean;
}

export const Table = Node.create<TableOptions>({
  name: "table",
  group: "block",
  content: "tableRow+",
  tableRole: "table",
  // Without isolating, backspace at the start of the first cell would eat the
  // table from the outside instead of editing inside it.
  isolating: true,
  allowGapCursor: true,

  addOptions() {
    return {
      cellMinWidth: 48,
      defaultCellMinWidth: 120,
      resizable: true,
    };
  },

  parseHTML() {
    return [{ tag: "table" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(HTMLAttributes), ["tbody", 0]];
  },

  /**
   * Applies to every node in the schema, not just this one — which is exactly
   * why it lives here once rather than on each of the four table nodes.
   */
  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };

    return {
      tableRole: callOrReturn(
        getExtensionField(extension, "tableRole", context),
      ),
    };
  },

  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = true } = {}) =>
        ({ tr, dispatch, editor }) => {
          const node = buildTable(
            editor.schema as never,
            Math.max(1, Math.min(rows, 25)),
            Math.max(1, Math.min(cols, 10)),
            withHeaderRow,
          );
          if (!node) return false;

          if (dispatch) {
            const offset = tr.selection.anchor + 1;
            tr.replaceSelectionWith(node)
              .scrollIntoView()
              .setSelection(TextSelection.near(tr.doc.resolve(offset)));
          }

          return true;
        },

      addColumnBefore:
        () =>
        ({ state, dispatch }) =>
          addColumnBefore(state, dispatch),
      addColumnAfter:
        () =>
        ({ state, dispatch }) =>
          addColumnAfter(state, dispatch),
      deleteColumn:
        () =>
        ({ state, dispatch }) =>
          deleteColumn(state, dispatch),
      addRowBefore:
        () =>
        ({ state, dispatch }) =>
          addRowBefore(state, dispatch),
      addRowAfter:
        () =>
        ({ state, dispatch }) =>
          addRowAfter(state, dispatch),
      deleteRow:
        () =>
        ({ state, dispatch }) =>
          deleteRow(state, dispatch),
      deleteTable:
        () =>
        ({ state, dispatch }) =>
          deleteTable(state, dispatch),
      mergeCells:
        () =>
        ({ state, dispatch }) =>
          mergeCells(state, dispatch),
      splitCell:
        () =>
        ({ state, dispatch }) =>
          splitCell(state, dispatch),
      mergeOrSplit:
        () =>
        ({ state, dispatch }) =>
          mergeCells(state, dispatch) || splitCell(state, dispatch),
      toggleHeaderRow:
        () =>
        ({ state, dispatch }) =>
          toggleHeaderRow(state, dispatch),
      toggleHeaderColumn:
        () =>
        ({ state, dispatch }) =>
          toggleHeaderColumn(state, dispatch),
      toggleHeaderCell:
        () =>
        ({ state, dispatch }) =>
          toggleHeaderCell(state, dispatch),
      setCellAttribute:
        (name, value) =>
        ({ state, dispatch }) =>
          setCellAttr(name, value)(state, dispatch),
      goToNextCell:
        () =>
        ({ state, dispatch }) =>
          goToNextCell(1)(state, dispatch),
      goToPreviousCell:
        () =>
        ({ state, dispatch }) =>
          goToNextCell(-1)(state, dispatch),
      fixTables:
        () =>
        ({ state, dispatch }) => {
          if (dispatch) {
            const fix = fixTables(state);
            if (fix) dispatch(fix);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Tab is the only way most people expect to move between cells, and it
      // has to lose to nothing else while the cursor is inside a table.
      Tab: () => {
        if (this.editor.commands.goToNextCell()) return true;
        if (!this.editor.can().addRowAfter()) return false;
        return this.editor.chain().addRowAfter().goToNextCell().run();
      },
      "Shift-Tab": () => this.editor.commands.goToPreviousCell(),
      // Backspace over a multi-cell selection should empty the cells, not take
      // the table structure with them.
      Backspace: ({ editor }) =>
        deleteCellSelection(editor.state, editor.view.dispatch),
      Delete: ({ editor }) =>
        deleteCellSelection(editor.state, editor.view.dispatch),
    };
  },

  addProseMirrorPlugins() {
    const resizing = this.options.resizable && this.editor.isEditable;

    return [
      ...(resizing
        ? [
            columnResizing({
              cellMinWidth: this.options.cellMinWidth,
              defaultCellMinWidth: this.options.defaultCellMinWidth,
            }),
          ]
        : []),
      tableEditing({ allowTableNodeSelection: false }),
    ];
  },
});

export const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  tableRole: "row",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

export const TableCell = Node.create({
  name: "tableCell",
  content: "block+",
  tableRole: "cell",
  isolating: true,

  addAttributes() {
    return cellAttributes();
  },

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});

export const TableHeader = Node.create({
  name: "tableHeader",
  content: "block+",
  tableRole: "header_cell",
  isolating: true,

  addAttributes() {
    return cellAttributes();
  },

  parseHTML() {
    return [{ tag: "th" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0];
  },
});

export const tableExtensions = [Table, TableRow, TableHeader, TableCell];

/**
 * Editor styles that Tailwind cannot express: prosemirror-tables' resize
 * handle and cell-selection overlay are pseudo-element work on nodes
 * ProseMirror owns, and the callout rules key off a data attribute. Injected
 * once per document rather than per editor.
 */
export const TABLE_STYLE_ELEMENT_ID = "odookrd-rich-text-editor-styles";

export const TABLE_STYLES = `
.ProseMirror .tableWrapper { overflow-x: auto; margin: 1.25rem 0; }
.ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
  overflow: hidden;
}
.ProseMirror table td,
.ProseMirror table th {
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.625rem;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  min-width: 3rem;
}
.ProseMirror table th {
  background: #f1f5f9;
  font-weight: 600;
  text-align: start;
}
.ProseMirror table td > *, .ProseMirror table th > * { margin-bottom: 0; }
.ProseMirror .selectedCell:after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(113, 75, 103, 0.14);
  pointer-events: none;
  z-index: 2;
}
.ProseMirror .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background: #714b67;
  pointer-events: none;
  z-index: 20;
}
.ProseMirror.resize-cursor { cursor: col-resize; }

/*
  Callouts were wrapping correctly but rendering as a plain block: the editor
  styles the elements it knows by tag, and a callout is a div. Without this a
  note, a warning and a paragraph are the same picture, so the buttons read as
  broken even though the document underneath was right.
*/
.ProseMirror [data-odookrd-callout="true"] {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  border-inline-start: 4px solid #7dd3fc;
  border-radius: 0.375rem;
  background: #f0f9ff;
}
.ProseMirror [data-odookrd-callout="true"][data-variant="warning"] {
  border-inline-start-color: #fcd34d;
  background: #fffbeb;
}
.ProseMirror [data-odookrd-callout="true"][data-variant="tip"] {
  border-inline-start-color: #6ee7b7;
  background: #ecfdf5;
}
.ProseMirror [data-odookrd-callout="true"] > *:last-child { margin-bottom: 0; }

/*
  Floated media needs the document to contain it. Without a clear, a wrapped
  image near the end of an article hangs out past the last paragraph and
  overlaps whatever follows the editor.
*/
.ProseMirror::after { content: ""; display: block; clear: both; }

/* The H1 button was added without a matching rule, so it looked like H2. */
.ProseMirror h1 {
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 600;
}
`;
