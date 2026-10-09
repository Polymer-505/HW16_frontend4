import userTemplate from "./templates/user.hbs";

const API = "https://6aaed44c606bd915d11112c2.mockapi.io/api/users";

let page = 1;
let limit = 5;
let totalPages = 0;

const refs = {
  userList: document.getElementById("usersList"),
  userForm: document.getElementById("userForm"),
  refreshBtn: document.getElementById("refresh"),
  loadTasksBtn: document.getElementById("loadTasksBtn"),
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

async function getAllUsers() {
  try {
    const response = await fetch(API);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const data = await response.json();

    renderUsers(data);
  } catch (error) {
    console.log(error);
  }
}

async function fetchProducts() {
  try {
    const response = await fetch(`${API}?page=${page}&limit=${limit}`);
    const data = await response.json();
    renderUsers(data);
  } catch (error) {
    console.log(error);
  }
}

async function getAllProducts() {
  try {
    const response = await fetch(API);
    const data = await response.json();
    totalPages = Math.ceil(data.length / limit);
    renderPagination();
  } catch (error) {
    console.log(error);
  }
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

if (refs.loadTasksBtn) {
  refs.loadTasksBtn.addEventListener("click", fetchUsersWithTasks);
}

async function fetchUsersWithTasks() {
  try {
    const response = await fetch(API);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const users = await response.json();

    console.log(`Found ${users.length} users. Loading their tasks`);

    const usersWithTasks = await Promise.all(
      users.map(async (user) => {
        const tasksResponse = await fetch(`${API}/${user.id}/tasks`);
        let tasks = [];

        if (tasksResponse.ok) {
          tasks = await tasksResponse.json();
        }

        return {
          ...user,
          tasks,
        };
      }),
    );

    console.log(usersWithTasks);
  } catch (error) {
    console.error("Error", error);
  }
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

async function createUser(data) {
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    refs.userForm.reset();
    getAllUsers();
  } catch (error) {
    console.log(error);
  }
}

async function updateUser(id, data) {
  try {
    editModalError.hidden = true;

    const response = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Не вдалося оновити користувача.");
    }

    closeModal();
    getAllUsers();
  } catch (error) {
    refs.editModalError.textContent =
      error.message || "Не вдалося оновити користувача.";
    refs.editModalError.hidden = false;
  }
}

async function deleteUser(id) {
  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }
    getAllUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
  }
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
