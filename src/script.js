import userTemplate from "./templates/user.hbs";

const API = "https://6aaed44c606bd915d11112c2.mockapi.io/api/users";

let page = 1;
let limit = 5;
let totalPages = 0;

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
  pagContainer: document.getElementById("pages"),
  prevBtn: document.getElementById("prev"),
  nextBtn: document.getElementById("next"),
};

let initialUserData = null;

refs.userForm.addEventListener("submit", submitUserForm);
refs.closeModalBtn.addEventListener("click", closeModal);
refs.cancelEditBtn.addEventListener("click", closeModal);
refs.editUserForm.addEventListener("submit", onSaveUser);
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

function getAllUsers() {
  fetch(API)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      return response.json();
    })
    .then((users) => renderUsers(users))
    .catch((err) => console.error("Error loading users:", err));
}

function fetchProducts() {
  fetch(`${API}?page=${page}&limit=${limit}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => renderUsers(data));
}

function getAllProducts() {
  fetch(API)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      totalPages = Math.ceil(data.length / limit);
      renderPagination();
    });
}

function renderPagination() {
  Array.from({ length: totalPages }).forEach((_, idx) => {
    refs.pagContainer.insertAdjacentHTML(
      "beforeend",
      `<button data-page="${idx + 1}">${idx + 1}</button>`,
    );
  });

  const allPag = refs.pagContainer.querySelectorAll("button");
  const activePag = Object.values(allPag).find(
    (pag) => Number(pag.dataset.page) === page,
  );

  activePag.classList.add("active");
}

if (refs.refreshBtn) {
  refs.refreshBtn.addEventListener("click", getAllUsers);
}

function renderUsers(users) {
  refs.userList.innerHTML = "";
  users.forEach((user) => {
    const html = userTemplate(user);
    refs.userList.insertAdjacentHTML("afterbegin", html);
  });
}

refs.pagContainer.addEventListener("click", (event) => {
  event.preventDefault();

  const target = event.target;
  if (target.tagName !== "BUTTON") {
    return;
  }
  page = Number(target.dataset.page);

  const allPag = refs.pagContainer.querySelectorAll("button");
  allPag.forEach((pag) => pag.classList.remove("active"));

  const activePag = Object.values(allPag).find(
    (pag) => Number(pag.dataset.page) === page,
  );

  activePag.classList.add("active");

  fetchProducts();
});

refs.prevBtn.addEventListener("click", () => {
  if (page > 1) {
    page--;

    const allPag = refs.pagContainer.querySelectorAll("button");
    allPag.forEach((pag) => pag.classList.remove("active"));

    const activePag = Object.values(allPag).find(
      (pag) => Number(pag.dataset.page) === page,
    );

    activePag.classList.add("active");

    fetchProducts();
  }
});

refs.nextBtn.addEventListener("click", () => {
  if (page < totalPages) {
    page++;

    const allPag = refs.pagContainer.querySelectorAll("button");
    allPag.forEach((pag) => pag.classList.remove("active"));

    const activePag = Object.values(allPag).find(
      (pag) => Number(pag.dataset.page) === page,
    );

    activePag.classList.add("active");

    fetchProducts();
  }
});

getAllUsers();
fetchProducts();
getAllProducts();

// Modal
function submitUserForm(e) {
  e.preventDefault();
  const data = new FormData(userForm);
  const formData = Object.fromEntries(data);
  createUser(formData);
}

function createUser(data) {
  fetch(API, {
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

function updateUser(id, data) {
  editModalError.hidden = true;

  fetch(`${API}/${id}`, {
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

function deleteUser(id) {
  fetch(`${API}/${id}`, {
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
