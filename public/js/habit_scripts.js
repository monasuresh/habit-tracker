const items = [];

function displayHabitLogError(message, errorContainerId) {
    const errorContainer = document.getElementById(errorContainerId);
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';

    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

function renderItems() {
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = '';

    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
          ${item.name}
          <div>
            <button class="btn btn-primary btn-sm mr-2" onclick="openModifyItemModal('${String(item.id)}')">Modify</button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('${String(item.id)}')">Delete</button>
            <button class="btn btn-success btn-sm" onclick="openTrackHabitModal('${String(item.id)}')">Track</button>
            <button class="btn btn-warning btn-sm" onclick="untrackHabit('${String(item.id)}')">Untrack</button>
          </div>
        `;
        itemList.appendChild(listItem);
    });
}

function openModifyItemModal(itemId) {
    item = items.find(i => i.id === itemId);

    const modifyItemForm = document.getElementById('modifyItemForm');

    modifyItemForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const modifyNameInput = document.getElementById('modifyNameInput');
        const modifyEffectInput = document.getElementById('modifyEffectInput');
        const modifyCategoryInput = document.getElementById('modifyCategoryInput');
        const modifyWeightInput = document.getElementById('modifyWeightInput');

        const newName = modifyNameInput.value;
        const newEffect = modifyEffectInput.value;
        const newCategory = modifyCategoryInput.value;
        const newWeight = modifyWeightInput.value;

        let validHabitParams = validateHabitParams(newName, newEffect, newCategory, newWeight, true, true);

        // Validate the input
        if (validHabitParams.isError === false) {
            submitModifyItemForm(itemId, validHabitParams);
        } else {
            return;
        }

    });

    $('#modifyItemModal').modal('show');
}

function submitModifyItemForm(itemId, validHabitParams) {
    // Make an AJAX request using jQuery
    $.ajax({
        type: 'PATCH',
        url: `/habits/modify/${itemId}`,
        contentType: 'application/json',
        data: JSON.stringify({
            nameInput: validHabitParams.name,
            effectInput: validHabitParams.effect,
            categoryInput: validHabitParams.category,
            weightInput: validHabitParams.weight,
        }),
    }).then(
        function (updatedHabit) {
            // Success callback
            const updatedItemIndex = items.findIndex(i => i.id === itemId);
            if (updatedItemIndex !== -1 && validHabitParams.name) {
                items[updatedItemIndex].name = validHabitParams.name.toUpperCase();
            }

            renderItems();

            $('#modifyItemModal').modal('hide');
        },
        function (jqXHR, textStatus, errorThrown) {
            // Error callback
            // Handle error response
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage, 'modifyHabitErrorContainer');
        }
    );
}


function deleteHabitOnServer(itemId) {
    // Make an AJAX request using jQuery
    $.ajax({
        type: 'DELETE',
        url: '/habits/delete-habit/' + itemId,
    }).then(
        function (deletedHabit) {
            //no op 
        },
        function (jqXHR, textStatus, errorThrown) {
            // Error callback
            // Handle error response
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage, 'errorContainer');
        }
    );

}

function deleteItem(itemId) {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (confirmDelete) {
        deleteHabitOnServer(itemId);

        const newItems = items.filter(item => item.id !== itemId);
        if (newItems.length === items.length) {
            //showError('Item not found.');
        } else {
            items.length = 0;
            items.push(...newItems);
            renderItems();
        }
    }
}

function addItem(newItemName) {
    // Validate the input
    if (newItemName.trim() === '') {
        //showError('Item name cannot be empty.');
        return;
    }

    const newItemId = items.length + 1;
    items.push({ id: newItemId, name: newItemName });
    renderItems();
    $('#addItemModal').modal('hide');
}

document.getElementById('addItemForm').addEventListener('submit', async function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    const createNameInput = document.getElementById('createNameInput').value;
    const createEffectInput = document.getElementById('createEffectInput').value;
    const createCategoryInput = document.getElementById('createCategoryInput').value;
    const createWeightInput = document.getElementById('createWeightInput').value;

    let validHabitParams = validateHabitParams(createNameInput, createEffectInput, createCategoryInput, createWeightInput, false, false);

    // Validate the input
    if (validHabitParams.isError === false) {
        submitAddItemForm(validHabitParams);
    } else {
        return;
    }
});

function submitAddItemForm(validHabitParams) {
    let requestConfig = {
        type: 'POST',
        url: '/habits/create-habit',
        contentType: 'application/json',
        data: JSON.stringify({
            nameInput: validHabitParams.name,
            effectInput: validHabitParams.effect,
            categoryInput: validHabitParams.category,
            weightInput: validHabitParams.weight,
        })
    }

    $.ajax(requestConfig).then(
        function (responseMessage) {
            // Add the habit to the items list
            items.push({ id: responseMessage._id, name: responseMessage.name });

            // Update the hidden input field with the new habit ID
            document.getElementById('newHabitId').value = responseMessage._id;

            // Render the updated items list
            renderItems();

            // Hide the modal
            $('#addItemModal').modal('hide');
            $(".modal-backdrop").remove();
        },
        function (jqXHR, textStatus, errorThrown) {
            // Error callback
            // Handle error response
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage, 'addItemErrorContainer');
        }
    );
}

function trackHabitFormSubmit(event, itemId) {
    event.preventDefault();

    const reminderTimeInput = document.getElementById('reminderTimeInput').value;

    let reminderTimeValidation = isValidTime24HourFormat(reminderTimeInput);

    if (reminderTimeValidation.isError === true) {
        return;
    }

    // Make an AJAX request using jQuery
    $.ajax({
        type: 'POST',
        url: '/habits/track/' + itemId,
        contentType: 'application/json',
        data: JSON.stringify({
            reminderTimeInput: reminderTimeValidation.timeInput,
        }),
    }).then(
        function (response) {
            // Success callback
            // Close the tracking modal
            // Iterate through items and update trackedHabitId when habitId matches
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === response.habitId) {
                    items[i].trackedHabitId = response._id;
                }
            }

            $('#trackHabitModal').modal('hide');
        },
        function (jqXHR, textStatus, errorThrown) {
            // Error callback
            // Handle error response
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage, 'trackHabitErrorContainer');
        }
    );

}

function openTrackHabitModal(itemId) {
    const trackHabitForm = document.getElementById('trackHabitForm');

    // Set the itemId as a property of the form
    trackHabitForm.itemId = itemId;

    // Add or update the event listener for the form submission
    trackHabitForm.onsubmit = function (event) {
        trackHabitFormSubmit(event, this.itemId);
    };

    $('#trackHabitModal').modal('show');
}

function untrackHabit(itemId) {
    const confirmUntrack = confirm("Are you sure you want to untrack this habit?");
    if (confirmUntrack) {
        // Find the tracked habit Id for the habit
        let habitToUntrackId;
        let habitToUntrack;

        for (let i = 0; i < items.length; i++) {
            const currentHabit = items[i];
            if (currentHabit.id === itemId) {
                habitToUntrackId = currentHabit.trackedHabitId;
                habitToUntrack = currentHabit;
            }
        }

        // Make an AJAX request to untrack the habit
        $.ajax({
            type: 'DELETE',
            url: '/tracked-habits/delete/' + habitToUntrackId,
            success: function () {
                console.log('Habit untracked successfully.');
                delete habitToUntrack.trackedHabitId;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // Handle error response
                let errorMessage = jqXHR.responseJSON.error;
                displayHabitLogError(errorMessage, 'errorContainer');
            }
        });
    }
}


function getHabitData() {
    // Make an AJAX request to get all habits
    $.ajax({
        type: 'GET',
        url: '/habits/view-all',
    }).then(
        function (response) {
            // Success callback for getting all habits
            for (let item of response) {
                items.push({ id: item._id, name: item.name });
            }

            // Make another AJAX request to get all tracked habits
            $.ajax({
                type: 'GET',
                url: '/tracked-habits/get-all',
            }).then(
                function (response) {
                    // Success callback for getting all tracked habits
                    // Render the habits on the page
                    for (let i = 0; i < items.length; i++) {
                        for (let item of response) {
                            if (items[i].id === item.habitId) {
                                items[i].trackedHabitId = item._id;
                            }
                        }
                    }
                    renderItems();
                },
                function (jqXHR, textStatus, errorThrown) {
                    // Error callback for getting all tracked habits
                    let errorMessage = jqXHR.responseJSON.error;
                    displayHabitLogError(errorMessage, 'errorContainer');
                }
            );
        },
        function (jqXHR, textStatus, errorThrown) {
            // Error callback for getting all habits
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage, 'errorContainer');
        }
    );
}

function validateHabitParams(name, effect, category, weight, hasOptionalParams, isModify) {
    // Habit name must start and end with alpha-numeric characters and be between 3 and 50 characters long
    let errorContainerToUse;
    let isError = false;

    if (isModify) {
        errorContainerToUse = 'modifyHabitErrorContainer';
    } else {
        errorContainerToUse = 'addItemErrorContainer';
    }

    if (hasOptionalParams === false) {
        if (!name || !effect || !category || !weight) {
            isError = true;
            displayHabitLogError('All fields need to be provided', errorContainerToUse);
        }
    } else {
        if (!name && !effect && !category && !weight) {
            isError = true;
            displayHabitLogError('At least one field needs to be provided.', errorContainerToUse);
        }
    }

    if ((name && typeof name !== 'string') || (effect && typeof effect !== 'string') || (category && typeof category !== 'string')) {
        isError = true;
        displayHabitLogError('Either the habit name, effect or category is not of type string. Those fields must be strings.', errorContainerToUse);
    }

    if (name) {
        name = name.trim();
    }

    if (effect) {
        effect = effect.trim();
    }

    if (category) {
        category = category.trim().toLowerCase();
    }

    if (weight && (typeof weight === "string")) {
        weight = weight.trim();
    }

    if ((name && name.length === 0) || (effect && effect.length === 0) || (category && category.length === 0) || (weight && weight.length === 0)) {
        isError = true;
        displayHabitLogError('The name, effect, category, and weight must not be an empty string or a string with just spaces.', errorContainerToUse);
    }

    if (weight && !Number.isInteger(parseFloat(weight))) {
        isError = true;
        displayHabitLogError('The weight must be an integer.', errorContainerToUse);
    }

    if (weight) {
        weight = parseInt(weight, 10);
        if (this.isNotValidNumber(weight)) {
            isError = true;
            displayHabitLogError('The weight is not of type number.', errorContainerToUse);
        }

        if ((!(weight >= 1 && weight <= 10) || !Number.isInteger(weight))) {
            isError = true;
            displayHabitLogError('The weight must be a positive, whole number between 1 and 10.', errorContainerToUse);
        }
    }

    const habitNameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9\s]{1,48}[a-zA-Z0-9])?$/;

    if (name && !habitNameRegex.test(name)) {
        isError = true;
        displayHabitLogError('The habit name must start and end with alphanumeric characters, must contain alphanumeric characters or spaces and be between 3 and 50 characters long', errorContainerToUse);
    }

    const effectRegex = /^(good|bad)$/i;

    if (effect && !effectRegex.test(effect)) {
        isError = true;
        displayHabitLogError('The effect must either be good or bad', errorContainerToUse);
    }

    const validCategories = [
        "healthandfitness",
        "personaldevelopment",
        "productivity",
        "financial",
        "relationships",
        "careerdevelopment",
        "social",
        "organization",
        "hobbies"
    ];


    const validCategoriesString = `Valid Categories: ${validCategories.join(", ")}`;

    const categoryRegex = /^(healthandfitness|personaldevelopment|productivity|financial|relationships|careerdevelopment|social|organization|hobbies)$/i;

    if (category && !categoryRegex.test(category)) {
        isError = true;
        displayHabitLogError(validCategoriesString, errorContainerToUse);
    }

    return { name, effect, category, weight, isError};
}

function isNotValidNumber(num) {
    return typeof num !== 'number' || isNaN(num) || num === Infinity || num === -Infinity;
}

function isValidTime24HourFormat(timeInput) {
    let isError = false;

    if (typeof timeInput !== 'string') {
        isError = true;
        displayHabitLogError('The time must be a string.', 'trackHabitErrorContainer');
    }

    timeInput = timeInput.trim();

    if (!timeInput) {
        isError = true;
        displayHabitLogError('The time cannot be an empty string or a string with just spaces.', 'trackHabitErrorContainer');
    }

    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

    if (!timeRegex.test(timeInput)) {
        isError = true;
        displayHabitLogError('The time is invalid.', 'trackHabitErrorContainer');
    }

    return { timeInput, isError };
}

$(document).ready(function () {
    getHabitData();
});

renderItems();