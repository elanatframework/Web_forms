const menuItems = [];
const defaultClass = "my-dropdown";
const stack = []; 

export function ddm_AddItem(text, url, level = "") {
  const item = { text, url, children: [] };
  const depth = level.length;

  if (depth === 0) {
    menuItems.push(item);
  } else {
    const parent = stack[depth - 1];
    if (!parent) throw new Error("Parent not found for depth " + depth);
    parent.children.push(item);
  }

  stack[depth] = item;
  stack.length = depth + 1;
}

export function ddm_ResetMenu() {
  menuItems.length = 0;
  stack.length = 0;
}

export function ddm_Render(className = defaultClass, appendMenuCSS = true) {
  function renderNode(items) {
    let html = `<ul class="${className}">`;
    for (const item of items) {
      html += `<li><a href="${item.url}">${item.text}</a>`;
      if (item.children.length > 0) {
        html += `<span class="ddm-toggle" onclick="ddm_ToggleSubmenu(event, this)">[+]</span> `;
      }
      if (item.children.length > 0) {
        html += renderNode(item.children);
      }
      html += `</li>`;
    }
    html += `</ul>`;
    return html;
  }

  if (appendMenuCSS) ddm_InjectMenuCSS(className);

  if (!window.ddm_ToggleSubmenu) {
    window.ddm_ToggleSubmenu = function(event, toggleSpan) {
      event.preventDefault();
      const li = toggleSpan.parentElement;
      const submenu = li.querySelector("ul");
      if (!submenu) return;
      if (submenu.style.display === "block") {
        submenu.style.display = "none";
        toggleSpan.textContent = "[+]";
      } else {
        submenu.style.display = "block";
        toggleSpan.textContent = "[-]";
      }
    };
  }

  return renderNode(menuItems);
}

export function ddm_GetMenuCSS(className = defaultClass) {
  return `
.${className} {
  list-style: none;
  padding: 0;
  margin: 0;
}

.${className} li {
  position: relative;
  margin: 2px 0;
}

.${className} li ul {
  display: none;
  padding-left: 15px;
  margin: 2px 0;
  list-style: none;
}

.${className} a {
  display: inline-block;
  padding: 5px 10px;
  text-decoration: none;
  background: #f0f0f0;
  color: #333;
}

.${className} li ul a {
  background: #e0e0e0;
}

.${className} .ddm-toggle {
  cursor: pointer;
  font-weight: bold;
  margin-right: 5px;
}
`;
}

export function ddm_InjectMenuCSS(className = defaultClass) {
  const style = document.createElement("style");
  style.textContent = ddm_GetMenuCSS(className);
  document.head.appendChild(style);
}