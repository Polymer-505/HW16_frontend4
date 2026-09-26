import userTemplate from "./templates/user.hbs";

const API_URL = "https://6aaed44c606bd915d11112c2.mockapi.io/api/users";

const refs = {
  userList: document.getElementById("usersList"),
  userForm: document.getElementById("userForm"),
  refreshBtn: document.getElementById("refresh"),
  modal: document.getElementById("modalBackdrop"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  editUserForm: document.getElementById("editUserForm"),
  editUserIdInput: document.getElementById("editUserId"),
  editNameInput: document.getElementById("editName"),
  editEmailInput: document.getElementById("editEmail"),
  editAgeInput: document.getElementById("editAge"),
  editModalError: document.getElementById("editModalError"),
};

let initialUserData = null;

function getAllUsers() {
  fetch(API_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      return response.json();
    })
    .then((users) => renderUsers(users))
    .catch((err) => console.error("Error loading users:", err));
}

function renderUsers(users) {
  refs.userList.innerHTML = "";
  users.forEach((user) => {
    const html = userTemplate(user);
    refs.userList.insertAdjacentHTML("afterbegin", html);
  });
}

getAllUsers();

if (refs.refreshBtn) {
  refs.refreshBtn.addEventListener("click", getAllUsers);
}

refs.userForm.addEventListener("submit", submitUserForm);

function submitUserForm(e) {
  e.preventDefault();
  const data = new FormData(userForm);
  const formData = Object.fromEntries(data);
  createUser(formData);
}

function createUser(data) {
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      refs.userForm.reset();
      getAllUsers();
    })
    .catch((err) => console.error("Error creating user:", err));
}

refs.userList.addEventListener("click", (event) => {
  const target = event.target;

  if (target.classList.contains("delete-user")) {
    const userId = target.dataset.id;
    deleteUser(userId);
  }

  if (target.classList.contains("edit-user")) {
    openEditModal(target.dataset);
  }
});

function deleteUser(id) {
  fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
    })
    .then(() => getAllUsers())
    .catch((err) => console.error("Error deleting user:", err));
}

function openModal() {
  refs.modal.classList.remove("is__hidden");
  document.body.classList.add("no__scrool");
}

function closeModal() {
  refs.modal.classList.add("is__hidden");
  document.body.classList.remove("no__scrool");
  refs.editModalError.hidden = true;
  refs.editModalError.textContent = "";
  refs.editUserForm.reset();
  refs.initialUserData = null;
}

function openEditModal(userData) {
  refs.editUserIdInput.value = userData.id;
  refs.editNameInput.value = userData.name;
  refs.editEmailInput.value = userData.email;
  refs.editAgeInput.value = userData.age;

  initialUserData = {
    name: userData.name,
    email: userData.email,
    age: String(userData.age),
  };

  openModal();
}

refs.closeModalBtn.addEventListener("click", closeModal);
refs.cancelEditBtn.addEventListener("click", closeModal);

refs.editUserForm.addEventListener("submit", onSaveUser);

function onSaveUser(e) {
  e.preventDefault();

  const userId = refs.editUserIdInput.value;
  const updatedData = {
    name: refs.editNameInput.value.trim(),
    email: refs.editEmailInput.value.trim(),
    age: refs.editAgeInput.value.trim(),
  };

  const isChanged =
    updatedData.name !== initialUserData.name ||
    updatedData.email !== initialUserData.email ||
    updatedData.age !== initialUserData.age;

  if (!isChanged) {
    closeModal();
    return;
  }

  updateUser(userId, updatedData);
}

function updateUser(id, data) {
  editModalError.hidden = true;

  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не вдалося оновити користувача.");
      }
      return response.json();
    })
    .then(() => {
      closeModal();
      getAllUsers();
    })
    .catch((error) => {
      refs.editModalError.textContent =
        error.message || "Не вдалося оновити користувача.";
      refs.editModalError.hidden = false;
    });
}
