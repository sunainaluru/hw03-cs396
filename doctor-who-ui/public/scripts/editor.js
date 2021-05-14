const baseURL = 'http://localhost:8081';

// Reset Button Logic
const initResetButton = () => {
    // if you want to reset your DB data, click this button:
    document.querySelector('#reset').onclick = ev => {
        fetch(`${baseURL}/reset/`)
            .then(response => response.json())
            .then(data => {
                console.log('reset:', data);
            });
    };
}

// Create Doc Form Logic
const createEVHandle = () => {
    document.querySelector('#create').onclick = ev => {
        addForm()
        processSaveOrCancel()
    }
}

const addForm = () => {
    document.getElementById('doctor').innerHTML = `
        <section id="error"> </section>
        <form id="form">
            <ul>
                <br>
                <!-- Name -->
                <label for="name">Name</label>
                <input type="text" id="form_name">
                <br>
                <!-- Seasons -->
                <label for="seasons">Seasons</label>
                <input type="text" id="form_seasons">
                <br>
                <!-- Ordering -->
                <label for="ordering">Ordering</label>
                <input type="text" id="form_order">
                <br>
                <!-- Image -->
                <label for="image_url">Image</label>
                <input type="text" id="form_url">
                <br>
                <!-- Buttons -->
                <button class="btn btn-main" id="save">Save</button>
                <button class="btn" id="cancel">Cancel</button>
            </ul>
        </form>
    `
    document.getElementById('companion').innerHTML = ``
};

// Save Create Doc Logic
const processSaveOrCancel = () => {
    document.querySelector('#save').onclick = ev => {
        const results = form_validation()
        if ((results.valid_name == true) && (results.valid_ssns == true)) {
            fetch('/doctors', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(results.data)
            })
            .then(response => {
                if (!response.ok) {
                    // send to catch block:
                    throw Error(response.statusText);
                } else {
                    return response.json();
                }
            })
            .then(data => {
                console.log('Success:', data);
                displayNewDoc(data);
                docList();
            })
            .catch(err => {
                console.error(err);
                alert('Error!');
            })
            ev.preventDefault()
        }
            
    }

    document.querySelector('#cancel').onclick = ev => {
        document.getElementById('doctor').innerHTML = ``
    }
};

const displayNewDoc = (docObj) => {

    document.querySelector('#doctor').innerHTML = `
    <h2>${docObj.name}</h2>
    <p style="text-align:right">
        <button id='edit' class="btn">Edit</button>
        <button id='delete' class="btn">Delete</button>
    </p>
    <img src="${docObj.image_url}" style="width:200px;height:350px;"/>
    <p>Seasons: ${docObj.seasons}</p>
    `
    compListByDoc(docObj._id)
    processEdit(docObj)
    processDelete(docObj)
}

const form_validation = () => {
    const data = {
        name: document.getElementById('form_name').value,
        seasons: document.getElementById('form_seasons').value.split(','),
        ordering: document.getElementById('form_order').value,
        image_url: document.getElementById('form_url').value
    }
    let valid_name = false
    let valid_ssns = false
    if (!data.name) {
        text = "Name is a required field";
        document.querySelector('#error').innerHTML = text;

    } else {
        valid_name = true
    }
    data.seasons.forEach((ssn) => {
        if (isNaN(ssn)) {
            text = "Seasons must be numbers";
            document.querySelector('#error').innerHTML = text;
        } else {
            valid_ssns = true
        }
    })
    const results = {
        data: data,
        valid_name: valid_name,
        valid_ssns: valid_ssns
    }
    return results
}

// Edit Doc Logic
const processEdit= (docObj) => {
    document.querySelector('#edit').onclick = ev => {
        addForm();
        document.querySelector('#save').innerHTML =  `
            <button class="btn btn-main" id="update">Update</button>
        `
        document.querySelector('#form_name').value = docObj.name
        document.querySelector('#form_seasons').value = docObj.seasons
        document.querySelector('#form_order').value = docObj.ordering
        document.querySelector('#form_url').value = docObj.image_url
        
        document.querySelector('#update').onclick = ev => {
            const results = form_validation()
            if ((results.valid_name == true) && (results.valid_ssns == true)) {
                fetch(`/doctors/${docObj._id}`, {
                    method: 'PATCH', 
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(results.data)
                })
                .then(response => {
                    if (!response.ok) {
                        // send to catch block:
                        throw Error(response.statusText);
                    } else {
                        return response.json();
                    }
                })
                .then(data => {
                    console.log('Success:', data);
                    displayNewDoc(data);
                    docList();
                })
                .catch(err => {
                    console.error(err);
                    alert('Error!');
                })
                ev.preventDefault()
            }
        }

        // if update form cancelled, need to display details again
        // can't just display docObj details, need to retrieve
        document.querySelector('#cancel').onclick = ev => {
            displayNewDoc(docObj);
        }

    }
}

// Delete Doc Logic
const processDelete= (docObj) => {
    document.querySelector('#delete').onclick = ev => {
        let result = window.confirm(`Are you sure you want to delete ${docObj.name}?`)
        if (result == true)
        {
            fetch(`/doctors/${docObj._id}`, {
                method: 'DELETE', 
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    // send to catch block:
                    throw Error(response.statusText);
                } else {
                    return response;
                }
            })
            .then(() => {
                console.log('Success:');
                docList();
                document.getElementById('doctor').innerHTML = ``
                document.getElementById('companion').innerHTML = ``
                
            })
            .catch(err => {
                console.error(err);
                alert('Error!');
            })
            ev.preventDefault()
        }
    }
}


// Doctors and Companions Display Logic
let doctors;
const docList = () => {
    fetch('/doctors')
    .then(response => response.json())
    .then(data => {
        // store the retrieved data in a global variable called "doctors"
        doctors = data;
        const listItems = data.map(item => `
            <li>
                <a href="#" data-id="${item._id}">${item.name}</a>
            </li>`
        );
        document.getElementById('doctors').innerHTML = `
            <ul>
                ${listItems.join('')}
            </ul>`
    })
    .then(attachEventHandlers);
};

let compsByDoc;
const compListByDoc = (id) => {
    fetch(`/doctors/${id}/companions`)
    .then(response => response.json())
    .then(data => {
        // store the retrieved data in a global variable called "compsByDoc"
        compsByDoc = data;
        const listItems = data.map(item => `
            <ul>
                <img src="${item.image_url}" style="width:70px;height:90px;" />
                <a href="#" data-id="${item._id}">${item.name}</a>
                
            </ul>`
        );
        document.getElementById('companion').innerHTML = `
            <ul>
                <h2> Companions </h2>
                ${listItems.join('')}
            </ul>`
    })
};

const attachEventHandlers = () => {
    // once the unordered list has been attached to the DOM
    // (by assigning the #doctors container's innerHTML),
    // you can attach event handlers to the DOM:
    document.querySelectorAll('#doctors a').forEach(a => {
        a.onclick = showDetail;
    });
};

const showDetail = ev => {
    const id = ev.currentTarget.dataset.id;

    // find the current doctor from the doctors array:
    const doctor = doctors.filter(doctor => doctor._id === id)[0];
    console.log(doctor);
    
    displayNewDoc(doctor);
    // append the doctor template to the DOM:
}

// invoke these functions when the page loads:
initResetButton();
docList();
createEVHandle();