class Column {
    constructor(name, type, description, params = {}) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.params = params;
    }

    toJSON() {
        var elem = {};
        elem["name"] = this.name;
        elem["type"] = this.type;
        elem["description"] = this.description;
        
        // distribution
        if ("interval" in this.params) {
            elem["interval"] = this.params["interval"];
            elem["distribution"] = {
                "moyenne": this.params["mean"],
                "variance": this.params["variance"]
            };
        }

        // liste 
        if ("length" in this.params) {
            console.log(this.params["length"]);
            elem["liste"] = {
                "isList": true,
                "n_element": this.params["length"]
            }
        } else {
            elem["liste"] = {
                "isList": false,
                "n_element": null
            };
        }

        if (this.type == "category") {
            elem["values"] = this.params["values"];
        } else if (this.type == "boolean") {
            elem["percentage_true"] = this.params["truePercentage"];
        }

        return elem;
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
        var res = {};
        res["N"] = N.value;
        var variables = [];

        this.columns.forEach((value) => {
            variables.push(value.toJSON());
        });
        res["variables"] = variables;

        return JSON.stringify(res, null, 4);
    }

    importFromJson(jsonData) {
        jsonData = JSON.parse(jsonData);  

        this.columns = [];
        N.value = jsonData["N"];

        jsonData["variables"].forEach((elem) => {
            var params = {};
            var name = elem["name"];
            var type = elem["type"];
            var des = elem["description"];
            
            if (elem["liste"]["isList"]) {
                params["length"] = elem["liste"]["n_element"];
            }

            if ("interval" in elem) {
                params["interval"] = elem["interval"];
                params["mean"] = elem["distribution"]["moyenne"];
                params["variance"] = elem["distribution"]["variance"];
            }

            if ("values" in elem) {
                params["values"] = elem["values"];
            }

            if ("percentage_true" in elem) {
                params["falsePercentage"] = 100 - elem["percentage_true"];
                params["truePercentage"] = elem["percentage_true"];
            }

            this.columns.push(new Column(name, type, des, params))
        });

    }
}

const db = new Database();

const columnsContainer = document.getElementById('columnsContainer');
const columnModal = document.getElementById('columnModal');
const columnForm = document.getElementById('columnForm');
const columnType = document.getElementById('columnType');
const numericParams = document.getElementById('numericParams');
const categoryParams = document.getElementById('categoryParams');
const booleanParams = document.getElementById('booleanParams');
const addCategoryValueBtn = document.getElementById('addCategoryValueBtn');
const categoryValuesList = document.getElementById('categoryValuesList');
const addColumnBtn = document.getElementById('addColumnBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importJson')
let editIndex = null;
const N = document.getElementById('N');

const additionalParams = document.getElementById('additionalParams');
const limitCheckbox = document.getElementById('limitCheckbox');
const limitNumber = document.getElementById('limitNumber');

// Show/hide the limit number input based on checkbox state
limitCheckbox.onchange = function() {
    if (limitCheckbox.checked) {
        limitNumber.style.display = 'block';
    } else {
        limitNumber.style.display = 'none';
    }
};

// Helper function to clear modal fields
function clearForm() {
    columnForm.reset();
    categoryValuesList.innerHTML = '';
    numericParams.style.display = 'none';
    categoryParams.style.display = 'none';
    booleanParams.style.display = 'none';
}

// Show modal with fields based on type
function showParamsByType(type) {
    if (type === 'string' ) {
        numericParams.style.display = 'none';
        categoryParams.style.display = 'none';
        booleanParams.style.display = 'none';
        additionalParams.style.display = 'block';
    } else if (type === 'float' || type === 'int') {
        numericParams.style.display = 'block';
        categoryParams.style.display = 'none';
        booleanParams.style.display = 'none';
        additionalParams.style.display = 'block'; // Show for float/int
    } else if (type === 'category') {
        categoryParams.style.display = 'block';
        numericParams.style.display = 'none';
        booleanParams.style.display = 'none';
        additionalParams.style.display = 'none'; // Hide for category
    } else if (type === 'boolean') {
        booleanParams.style.display = 'block';
        categoryParams.style.display = 'none';
        numericParams.style.display = 'none';
        additionalParams.style.display = 'block'; // Show for boolean
    } else {
        additionalParams.style.display = 'block'; // Default for other types
    }
}

// Pre-fill form when editing a column
function fillFormWithData(column) {
    document.getElementById('columnName').value = column.name;
    document.getElementById('columnType').value = column.type;
    document.getElementById('columnDescription').value = column.description;
    showParamsByType(column.type);
    
    if (column.type === 'float' || column.type === 'int') {
        document.getElementById('interval').value = column.params.interval;
        document.getElementById('mean').value = column.params.mean;
        document.getElementById('variance').value = column.params.variance;
    } else if (column.type === 'category') {
        categoryValuesList.innerHTML = ''; // Clear the list
        column.params.values.forEach(value => {
            const valueDiv = document.createElement('div');
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.placeholder = 'Category Value';
            valueInput.value = value.value;

            const percentageInput = document.createElement('input');
            percentageInput.type = 'number';
            percentageInput.placeholder = '%';
            percentageInput.min = 0;
            percentageInput.max = 100;
            percentageInput.value = value.percentage;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => valueDiv.remove();

            valueDiv.appendChild(valueInput);
            valueDiv.appendChild(percentageInput);
            valueDiv.appendChild(removeBtn);
            categoryValuesList.appendChild(valueDiv);
        });
    } else if (column.type === 'boolean') {
        document.getElementById('truePercentage').value = column.params.truePercentage;
    }

    // Pre-fill the limit checkbox and number if they exist
    if (column.params["length"]) {
        limitCheckbox.checked = true;
        limitNumber.value = column.params.length;
        limitNumber.style.display = 'block';
    } else {
        limitCheckbox.checked = false;
        limitNumber.style.display = 'none';
    }
}


// Add a new category value with percentage
addCategoryValueBtn.onclick = () => {
    const valueDiv = document.createElement('div');
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Category Value';
    
    const percentageInput = document.createElement('input');
    percentageInput.type = 'number';
    percentageInput.placeholder = '%';
    percentageInput.min = 0;
    percentageInput.max = 100;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => valueDiv.remove();

    valueDiv.appendChild(valueInput);
    valueDiv.appendChild(percentageInput);
    valueDiv.appendChild(removeBtn);
    categoryValuesList.appendChild(valueDiv);
};

// Handle Add/Edit Column form submission
columnForm.onsubmit = function(event) {
    event.preventDefault();
    const name = document.getElementById('columnName').value;
    const type = document.getElementById('columnType').value;
    const description = document.getElementById('columnDescription').value;

    let params = {};
    if (type === 'float' || type === 'int') {
        params.interval = document.getElementById('interval').value;
        params.mean = parseFloat(document.getElementById('mean').value);
        params.variance = parseFloat(document.getElementById('variance').value);
    } else if (type === 'category') {
        params.values = [];
        let totalPercentage = 0;
        categoryValuesList.querySelectorAll('div').forEach(div => {
            const value = div.querySelector('input[type="text"]').value;
            const percentage = parseFloat(div.querySelector('input[type="number"]').value);
            totalPercentage += percentage;
            params.values.push({ value, percentage });
        });

        if (totalPercentage !== 100) {
            alert('The sum of category percentages must be 100%');
            return;
        }
    } else if (type === 'boolean') {
        const truePercentage = parseFloat(document.getElementById('truePercentage').value);
        if (truePercentage < 0 || truePercentage > 100) {
            alert('True percentage must be between 0 and 100');
            return;
        }
        params.truePercentage = truePercentage;
        params.falsePercentage = 100 - truePercentage;
    }

    // Handle limit elements checkbox and number
    if (limitCheckbox.checked) {
        const limit = parseInt(limitNumber.value);
        if (isNaN(limit) || limit < 1) {
            alert('Please enter a valid number of elements.');
            return;
        }
        params.length = limit;
    }

    const column = new Column(name, type, description, params);

    if (editIndex === null) {
        db.addColumn(column);
    } else {
        db.updateColumn(editIndex, column);
    }

    closeModal();
    renderColumns();
};


// Function to open modal for adding/editing a column
function openModal(index = null) {
    columnModal.style.display = 'block';
    if (index !== null) {
        const column = db.columns[index];
        fillFormWithData(column);
        editIndex = index;
    } else {
        clearForm();
        editIndex = null;
    }
}

// Close the modal
function closeModal() {
    columnModal.style.display = 'none';
    clearForm();
}

document.querySelector('.close').onclick = closeModal;
window.onclick = function(event) {
    if (event.target == columnModal) {
        closeModal();
    }
};

// Show modal to add new column
addColumnBtn.onclick = () => openModal();

// Handle column type change
columnType.onchange = (e) => showParamsByType(e.target.value);

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
            <p><strong>Parameters:</strong></p>
            <p> ${JSON.stringify(column.params, null, "\t")} </p>
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
    if (N.value == "") {
        alert("Merci d'indiquer la valeur de N!")
        return;
    }
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
importBtn.onchange = function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const json = e.target.result;
        db.importFromJson(json);
        renderColumns();
    };
    reader.readAsText(file);
};
