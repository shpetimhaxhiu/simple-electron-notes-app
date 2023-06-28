const { ipcRenderer } = require("electron");

// Helper functions
function getById(id) {
  return document.getElementById(id);
}

function createElement(tagName) {
  return document.createElement(tagName);
}

function clearInputs(ipcRenderer) {
  // Remove all notes from the list
  getById("note-list").innerHTML = "";
  getById("reset-button").textContent = "Reset";
  getById("submit-button").textContent = "Add Note";
  getById("date-time-created").textContent = "";
  getById("hidden-input").value = "";
  getById("note").value = "";
  getById("extra-note").value = "";

  ipcRenderer.send("get-notes");
}

// Form validation
getById("note").addEventListener("input", (evt) => {
  if (evt.target.value) {
    evt.target.classList.remove("is-invalid");
  }
});

let formSubmitHandler = (evt) => {
  evt.preventDefault();
  const id = evt.target[0].value || null;
  const note = evt.target[1].value;
  const extraNote = evt.target[2].value;

  if (!note) {
    getById("note").classList.add("is-invalid");
    return;
  }

  if (id) {
    ipcRenderer.send("edit-note", { id, note, extraNote });
  } else {
    ipcRenderer.send("add-note", { note, extraNote });
  }
};

getById("note-form").addEventListener("submit", formSubmitHandler);

ipcRenderer.on("note-added", (event, id) => {
  // const noteList = getById("note-list");
  // const noteItem = createElement("li");
  // noteItem.textContent = `${getById("note").value} ${
  //   getById("extra-note").value
  // }`;
  // noteItem.id = `note-${id}`;

  // const deleteButton = createElement("button");
  // deleteButton.className = "delete-button";
  // deleteButton.dataset.id = id;
  // deleteButton.textContent = "X";

  // noteItem.appendChild(deleteButton);
  // noteItem.className = "list-group-item";
  // noteList.appendChild(noteItem);

  clearInputs(ipcRenderer);
});

ipcRenderer.on("note-edited", (event, id) => {
  // const noteItem = document.querySelector(`#note-${id}`);
  // noteItem.textContent = `${getById("note").value} ${
  //   getById("extra-note").value
  // }`;
  clearInputs(ipcRenderer);
});

getById("note-list").addEventListener("click", (evt) => {
  if (evt.target && evt.target.classList.contains("delete-button")) {
    const id = evt.target.dataset.id;

    // Open the modal #delete-modal from index.html
    const deleteModal = new bootstrap.Modal(
      document.getElementById("delete-modal"),
      {
        backdrop: false,
      }
    );

    deleteModal.show();

    // If the user clicks the delete button in the modal
    getById("delete-button-cnfr").addEventListener("click", (evt) => {
      ipcRenderer.send("delete-note", { id });

      deleteModal.hide();
    });

    // If the user clicks the cancel button in the modal
    getById("cancel-button-cnfr").addEventListener("click", (evt) => {
      deleteModal.hide();
    });
  } else if (evt.target && evt.target.nodeName === "LI") {
    const id = evt.target.id.replace("note-", "");
    ipcRenderer.send("get-note", { id });
  }
});

ipcRenderer.on("note", (event, note) => {
  getById("note").value = note.note;
  getById("extra-note").value = note.extraNote;

  const hiddenInput = getById("hidden-input");
  hiddenInput.value = note._id;

  const dateCreated = getById("date-time-created");
  const date = new Date(note.dateTime);
  dateCreated.textContent = date.toLocaleString();

  getById("note-form").removeEventListener("submit", formSubmitHandler);
  getById("note-form").addEventListener("submit", formSubmitHandler);

  getById("submit-button").textContent = "Save Note";
  getById("reset-button").textContent = "Cancel Edit";
});

getById("reset-button").addEventListener("click", (evt) => {
  clearInputs(ipcRenderer);
  getById("hidden-input").value = "";

  getById("note-form").removeEventListener("submit", formSubmitHandler);
  getById("note-form").addEventListener("submit", formSubmitHandler);

  getById("submit-button").textContent = "Add Note";
  getById("reset-button").textContent = "Reset";

  ipcRenderer.send("get-notes");
});

ipcRenderer.on("note-deleted", (event, id) => {
  // const noteItem = document.querySelector(`#note-${id}`);
  // noteItem.parentNode.removeChild(noteItem);
  clearInputs(ipcRenderer);
});

ipcRenderer.send("get-notes");

ipcRenderer.on("notes", (event, notes) => {
  const noteList = getById("note-list");

  noteList.innerHTML = "";

  let monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  notes.forEach((note) => {
    const noteItem = createElement("li");
    const date = new Date(note.dateTime);
    note.dateTime = `${date.getHours()}:${date.getMinutes()} - ${date.getDate()} ${
      monthNames[date.getMonth()]
    }`;

    noteItem.innerHTML = `<span class="dateTime text-muted fw-light me-3">${note.dateTime}</span> <span class="note flex-grow-1">${note.note}</span>`;
    noteItem.className = "";

    const deleteButton = createElement("button");
    deleteButton.className =
      "delete-button btn btn-danger btn-sm float-end fa fa-trash";
    deleteButton.dataset.id = note._id;

    noteItem.appendChild(deleteButton);
    noteItem.id = `note-${note._id}`;
    noteItem.className = "list-group-item align-items-center";

    noteList.appendChild(noteItem);
  });
});
