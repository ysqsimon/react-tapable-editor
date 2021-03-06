import { EditorState } from "draft-js";
import getSelectionRectRelativeToOffsetParent from "../utils/rect/getSelectionRectRelativeToOffsetParent";
import clamp from "../helpers/clamp";
import getRootNode from "../utils/rect/getRootNode";

function InlineToolbar() {
  let isToolbarVisible = false;
  let lastMouseTargetAtInlineBar = false;
  let inlineToolbarNode;

  let editorStateAfterClickLinkButton;

  // 比如用户选择一个区域，弹出了inline-bar这个时候点击其它非editor中的其它区域；
  // 选中区域会变成灰色；这个时候再点击其中的一个文字，使editor focus，你会发现
  // `inline-bar`会闪现一下；这个是因为，当用户再次点击editor时，它首先触发的刚刚
  // 的`selection`然后再移动到指定的位置
  let timeoutHandler;

  this.apply = getEditor => {
    const { hooks, editorRef, inlineToolbarRef } = getEditor();

    const setupEditorState = editorState => {
      editorStateAfterClickLinkButton = editorState;
    };

    const clearUpEditorState = editorState => {
      editorStateAfterClickLinkButton = undefined;
    };

    const nodeHiddenHandler = node => {
      // 如果没有这个逻辑处理，当用户点击了`link` button以后，直接点击`Esc`的话，`inlineToolbar`
      // 消失，但是此时刚刚的selection是灰色的；
      if (editorStateAfterClickLinkButton) {
        const selection = editorStateAfterClickLinkButton.getSelection();
        const nextState = EditorState.set(editorStateAfterClickLinkButton, {
          selection: selection.merge({
            hasFocus: false
          })
        });
        hooks.setState.call(nextState);
      }

      const n =
        node || inlineToolbarNode || document.querySelector(".inline-toolbar");
      n.style.display = "none";
      n.style.visibility = "invisible";
      isToolbarVisible = false;
      hooks.inlineBarChange.call(null, "hidden");
    };

    const hiddenHandler = (editorState, inlineToolbarRef) => {
      clearTimeout(timeoutHandler);
      if (!isToolbarVisible) return;
      inlineToolbarRef.current.style.display = "none";
      inlineToolbarRef.current.style.visibility = "invisible";
      isToolbarVisible = false;
      hooks.inlineBarChange.call(editorState, "hidden");
    };

    const visibleHandler = (editorState, editorRef, inlineToolbarRef) => {
      clearTimeout(timeoutHandler);
      timeoutHandler = setTimeout(() => {
        // if (isToolbarVisible) return 如果加了这个判断就不能够及时的进行位置更新了
        if (!inlineToolbarRef.current) return;
        const rect = getSelectionRectRelativeToOffsetParent(editorRef);
        if (!rect) return;

        inlineToolbarRef.current.style.display = "block";
        inlineToolbarRef.current.style.visibility = "visible";

        const { top, left, width } = rect;
        const inlineToolbarHeight = inlineToolbarRef.current.offsetHeight;
        const inlineToolbarWidth = inlineToolbarRef.current.offsetWidth;
        const nextTop = top - inlineToolbarHeight - 15;
        const rootNode = getRootNode(editorRef);
        const { offsetRight } = rootNode;

        // 考虑到left的最小和最大值的边界
        const minLeft = 0;
        const maxLeft = offsetRight - inlineToolbarRef.current.offsetWidth;
        const tmpLeft = left - inlineToolbarWidth / 2 + width / 2;

        const nextLeft = clamp(tmpLeft, minLeft, maxLeft);

        inlineToolbarRef.current.style.top = `${nextTop}px`;
        inlineToolbarRef.current.style.left = `${nextLeft}px`;

        if (tmpLeft !== nextLeft) {
          // 已经移动到了边界，这个时候不应该再显示三角符号
          inlineToolbarRef.current.style.overflow = "hidden";
        } else {
          inlineToolbarRef.current.style.overflow = "visible";
        }
        isToolbarVisible = true;
        hooks.inlineBarChange.call(editorState, "visible");
      }, 100);
    };

    // TODO clean up `removeEventListener`
    document.addEventListener("mousedown", e => {
      inlineToolbarNode =
        inlineToolbarNode || document.querySelector(".inline-toolbar");
      const appRoot = document.querySelector("#app");
      let node = e.target;
      if (!inlineToolbarNode) return;
      lastMouseTargetAtInlineBar = false;
      while (node !== document.body) {
        if (node === inlineToolbarNode) {
          lastMouseTargetAtInlineBar = true;
          break;
        }

        if (node === appRoot) {
          if (isToolbarVisible) {
            nodeHiddenHandler(inlineToolbarNode);
          }
          break;
        }
        node = node.parentNode;
      }

      if (node === document.body && isToolbarVisible) {
        nodeHiddenHandler(inlineToolbarNode);
      }
    });

    hooks.hideInlineToolbar.tap("inlineToolbarPlugin", collapseSelection => {
      if (isToolbarVisible)
        nodeHiddenHandler(inlineToolbarNode, collapseSelection);
    });

    hooks.selectionCollapsedChange.tap(
      "InlineToolbar",
      (editorState, selectionChanged) => {
        const {
          newValue: { isCollapsed }
        } = selectionChanged;
        clearTimeout(timeoutHandler);
        if (isCollapsed && isToolbarVisible) {
          hiddenHandler(editorState, inlineToolbarRef);
        }

        if (!isCollapsed) {
          visibleHandler(editorState, editorRef, inlineToolbarRef);
        }
      }
    );

    hooks.selectionRangeChange.tap(
      "InlineToolbar",
      (editorState, selectionChanged) => {
        visibleHandler(editorState, editorRef, inlineToolbarRef);
      }
    );

    hooks.selectionFocusChange.tap(
      "InlineToolbar",
      (editorState, selectionChanged) => {
        const {
          newValue: { hasFocus, isCollapsed }
        } = selectionChanged;

        // !hasFocus && isCollapsed当用户选中一个区域以后，这个时候有inlineToolbar, 当点击页面中其它
        // 区域（只是focus变化，selectionRange没变），这个时候应该要消掉toolbar；但是如果说，用户点击
        // 的是`inline-toolbar`区域中的一部分的话，它不应该消失掉；这里面通过`lastMouseTargetAtInlineBar`
        // 进行实现
        if (!hasFocus && !lastMouseTargetAtInlineBar) {
          hiddenHandler(editorState, inlineToolbarRef);
        }
        if (hasFocus && !isCollapsed) {
          visibleHandler(editorState, editorRef, inlineToolbarRef);
        }
      }
    );

    hooks.afterClickLinkButton.tap("InlineToolbarPlugin", editorState => {
      setupEditorState(editorState);
    });

    hooks.cleanUpLinkClickState.tap("InlineToolbarPlugin", () => {
      clearUpEditorState();
    });
  };
}

export default InlineToolbar;
