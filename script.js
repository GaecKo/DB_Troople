class Column {
    constructor(name, type, description) {
        this.name = name;
        this.type = type;
        this.description = description;
    }
}

class Database {
    constructor() {
        this.columns = [];
    }

    addColumn(column) {
        this.columns.push(column);
    }

    updateColumn(index, column) {
        this.columns[index] = column;
    }

    deleteColumn(index) {
        this.columns.splice(index, 1);
    }

    exportToJson() {
        return JSON.stringify(this.columns, null, 4);
    }

    importFromJson(jsonData) {
        this.columns = JSON.parse(jsonData);
    }
}

const db = new Database();
const columnsContainer = document.getElementById('columnsContainer');
const columnModal = document.getElementById('columnModal');
const columnForm = document.getElementById('columnForm');
const addColumnBtn = document.getElementById('addColumnBtn');
const exportBtn = document.getElementById('exportBtn');
const importJson = document.getElementById('importJson');
let editIndex = null;

// Functions to handle modal
function openModal(index = null) {
    columnModal.style.display = 'block';
    if (index !== null) {
        const column = db.columns[index];
        document.getElementById('columnName').value = column.name;
        document.getElementById('columnType').value = column.type;
        document.getElementById('columnDescription').value = column.description;
        document.getElementById('columnIndex').value = index;
        editIndex = index;
    } else {
        columnForm.reset();
        editIndex = null;
    }
}

function closeModal() {
    columnModal.style.display = 'none';
}

document.querySelector('.close').onclick = closeModal;
window.onclick = function(event) {
    if (event.target == columnModal) {
        closeModal();
    }
};

// Handle Add/Edit Column
columnForm.onsubmit = function(event) {
    event.preventDefault();
    const name = document.getElementById('columnName').value;
    const type = document.getElementById('columnType').value;
    const description = document.getElementById('columnDescription').value;

    const column = new Column(name, type, description);

    if (editIndex === null) {
        db.addColumn(column);
    } else {
        db.updateColumn(editIndex, column);
    }

    closeModal();
    renderColumns();
};

// Render columns on the page
function renderColumns() {
    columnsContainer.innerHTML = '';
    db.columns.forEach((column, index) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column-item';
        columnDiv.innerHTML = `
            <h3>${column.name}</h3>
            <p><strong>Type:</strong> ${column.type}</p>
            <p><strong>Description:</strong> ${column.description}</p>
            <div class="buttons">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
            </div>
        `;

        columnDiv.querySelector('.edit').onclick = () => openModal(index);
        columnDiv.querySelector('.delete').onclick = () => {
            db.deleteColumn(index);
            renderColumns();
        };

        columnsContainer.appendChild(columnDiv);
    });
}

// Handle export JSON
exportBtn.onclick = function() {
    const json = db.exportToJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.json';
    a.click();
    URL.revokeObjectURL(url);
};

// Handle import JSON
importJson.onchange = function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const json = e.target.result;
        db.importFromJson(json);
        renderColumns();
    };
    reader.readAsText(file);
};

// Show modal to add new column
addColumnBtn.onclick = () => openModal();
