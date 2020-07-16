class Task {
    constructor(id, title) {
      this.id = id;
      this.title = title;
      this.priority = {};
      this.userId = '';
    }
  }
  
  let uid = null;

  class TaskListPage {
    constructor() {
      this.tasks = [];
      this.priorities = [];
      
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          uid = user.uid;
          firebase.database().ref("priorities").once("value", (prioritiesSnapshot) => {
            const allPriorities = prioritiesSnapshot.val();
            Object.keys(allPriorities).forEach(priorityId => {
              const priorityData = allPriorities[priorityId];
              const priority = {
                id: priorityId,
                name: priorityData.name,
                color: priorityData.color
              };
              taskListPage.priorities.push(priority);
            });

            firebase.database().ref("tasks").once("value", (snapshot) => {
              const allTasks = snapshot.val();
              Object.keys(allTasks).forEach((taskId) => {
                const taskData = allTasks[taskId];
                if (taskData.userId == uid) {
                  const task = new Task(taskId, taskData.title);
                  task.userId = uid;
        
                  if (taskData.priorityId) {
                    const priority = taskListPage.priorities.find(priority => priority.id == taskData.priorityId);
                    task.priority = priority;
                  }
        
                  taskListPage.tasks.push(task);
        
                  const taskListElement = document.getElementById("taskList");
                  const row = document.createElement("tr");
                  row.setAttribute("data-task-id", task.id);
                  row.innerHTML = `
                    <td>${task.title}<span class="badge badge-success">${task.priority.name}</span></td>
                    <td>
                      <button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button>
                      <button data-action="delete" data-task-id="${task.id}" class="btn btn-danger">Delete</button>
                    </td>
                    `;
                  taskListElement.appendChild(row);
                }
              });
            });
          });
        } else {
          console.log("no user signed in");
        }
      });
    }
  
    addTask(title) {
      const priorityElement = document.getElementById('dropdownMenuButton').innerHTML;
      
      if (priorityElement === 'Task Priority') {
        document.getElementById('warningMessage').setAttribute('style', "color: red; display: block");
        return;
      }
      
      const priority = {
        id: '',
        name: '',
        color: ''
      };
      
      if (priorityElement === 'High') {
        priority.name = 'high';
        priority.color = 'red';
      } else if (priorityElement === 'Medium') {
        priority.name = 'medium';
        priority.color = 'yellow';
      } else if (priorityElement === 'Low') {
        priority.name = 'low';
        priority.color = 'green';
      }

      const newPrioritySnapshot = firebase.database().ref('priorities').push({
        color: priority.color,
        name: priority.name
      });
      priority.id = newPrioritySnapshot.key;

      // const taskId = this.tasks.length + 1;
      const newTaskSnapshot = firebase.database().ref('tasks').push({
        title: title,
        priorityId: priority.id,
        userId: uid
      });
      const taskId = newTaskSnapshot.key;
  
      const task = new Task(taskId, title);
      task.priority = priority;
      task.userId = uid;
      this.priorities.push(priority);
      this.tasks.push(task);
  
      const taskListElement = document.getElementById("taskList");
      const row = document.createElement("tr");
      row.setAttribute("data-task-id", task.id);
      row.innerHTML = `
        <td>${task.title}<span class="badge badge-success">${task.priority.name}</span></td>
        <td>
          <button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button>
          <button data-action="delete" data-task-id="${task.id}" class="btn btn-danger">Delete</button>
        </td>
      `;
      taskListElement.appendChild(row);
      document.getElementById("task").value = "";
      document.getElementById('dropdownMenuButton').innerHTML = `Task Priority`;
      document.getElementById('warningMessage').setAttribute('style', "color: red; display: none");
    }
  
    startEdittingTask(taskId) {
      for (let k = 0; k < this.tasks.length; k++) {
        if (this.tasks[k].id == taskId) {
          const task = this.tasks[k];
  
          const taskInputElement = document.getElementById("task");
          taskInputElement.value = task.title;
          taskInputElement.setAttribute("data-task-id", task.id);
          document.getElementById("addBtn").innerText = "Save";
        }
      }
    }
  
    saveTaskTitle(taskId, taskTitle) {
      const task = this.tasks.find((task) => task.id == taskId);
      if (!task) return;
  
      task.title = taskTitle;
  
      firebase.database().ref('tasks/' + taskId + '/title').set(taskTitle);
  
      const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
      if (!existingRow) return;
  
      existingRow.children[0].innerHTML = `${task.title}<span class="badge badge-success">${task.priority.name}</span>`;
      const taskInput = document.getElementById("task");
      taskInput.removeAttribute("data-task-id");
      taskInput.value = "";
      document.getElementById("addBtn").innerText = "Add";
      document.getElementById('warningMessage').setAttribute('style', "color: red; display: none");
    }
  
    delete(taskId) {
      const task = this.tasks.find((task) => task.id == taskId);
      if (!task) return;
  
      firebase.database().ref('tasks/' + taskId).remove();
      firebase.database().ref('priorities/' + task.priority.id).remove();
  
      const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
      if (!existingRow) return;
      existingRow.remove();
    }
  }
  
  const taskListPage = new TaskListPage();
  
  document.getElementById("addBtn").addEventListener("click", (e) => {
    const taskInputElement = document.getElementById("task");
    const taskTitle = taskInputElement.value;
  
    const existingTaskId = taskInputElement.getAttribute("data-task-id");
    if (existingTaskId) {
      taskListPage.saveTaskTitle(existingTaskId, taskTitle);
    } else {
      taskListPage.addTask(taskTitle);
    }
  });
  
  document.getElementById("taskList").addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    const taskId = e.target.getAttribute("data-task-id");
  
    if (action == "edit") {
      taskListPage.startEdittingTask(taskId);
    } else if (action == "delete") {
      taskListPage.delete(taskId);
    }
  });
  
  document.getElementById("highPrio").addEventListener("click", e => {
    const dropDown = document.getElementById('dropdownMenuButton');
    dropDown.innerHTML = `High`;
  });

  document.getElementById("medPrio").addEventListener("click", e => {
    const dropDown = document.getElementById('dropdownMenuButton');
    dropDown.innerHTML = `Medium`;
  });

  document.getElementById("lowPrio").addEventListener("click", e => {
    const dropDown = document.getElementById('dropdownMenuButton');
    dropDown.innerHTML = `Low`;
  });

  // Need to fix code, bug is if previous user closed app without logging out, the user
  // is still logged in, so on the next instance of the app, even if the user enters the wrong
  // email or password, the task-list will still load.
  document.getElementById('loginBtn').addEventListener('click', e => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      console.log('error', error.message);
      document.getElementById('consoleMessage').innerHTML = `${error.message}`;
    });

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        document.getElementById('welcomePage').setAttribute('style', 'display:none');
        document.getElementById('loginPage').setAttribute('style', 'display:none');
        document.getElementById('task-app').setAttribute('style', 'display:block');
        document.getElementById('consoleMessage').innerHTML = '';
        document.getElementById('emailInput').value = '';
        document.getElementById('passwordInput').value = '';
      }
    });
  });

  document.getElementById('registerBtn').addEventListener('click', e => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
      console.log('error', error.message);
      document.getElementById('consoleMessage').innerHTML = `${error.message}`;
    });
    document.getElementById('consoleMessage').innerHTML = 'User successfully registered, you may now login.';
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
  });

  document.getElementById('logoutBtn').addEventListener('click', e => {
    e.preventDefault();
    firebase.auth().signOut().then(function() {
      document.getElementById('consoleMessage').innerHTML = 'Signout successful.';
    }).catch(function(error) {
      console.log('Could not sign out', error.message);
    });
    document.getElementById('taskList').innerHTML = '';
    document.getElementById('task').value = '';
    document.getElementById('welcomePage').setAttribute('style', 'display:block');
    document.getElementById('loginPage').setAttribute('style', 'display:block');
    document.getElementById('task-app').setAttribute('style', 'display:none');
    uid = null;
    taskListPage.priorities = [];
    taskListPage.tasks = [];
  });


  
  // Notes

  // function getData2(prop1, prop2) {
  
  // }
  
  // function getData(propertyHolder) {
  //     //propertyHolder.prop1
  //     //propertyHolder.prop2
  // }
  
  // function getData() {
  //     this.prop1 = "a";
  //     this.prop2 = "b";
  
  //     getData2(this.prop1, this.prop2);
  // }
  
  // const MyDatabase = {
  //   key1: "value abc",
  //   key2: "",
  //   key3: 5,
  //   key4: {
  //     subKey1: "abc",
  //     subKey2: {
  //       subSubKey1: "abc"
  //     }
  //   }
  // }
  
  // const json = JSON.stringify(MyDatabase);
  // {
  //   "key1": "value abc",
  //   "key2": "",
  //   "key3": 5
  // }
  
  // const back = JSON.parse(json);
  
  // HTTP GET MyDatabase/key4/subKey1
  
  // 1. Fetch all priorities from firebase
  // 2. Loop through all firebases tasks
  // for (var k = 0; k < fbTasksDb.length; k++) {
  //   const priorityId = fbTasksDb[k].priorityId;
  //   //    look up the priority by ID
  //   const priority = {}; // findById();
  //   const task = new Task(id, title, priority);
  // }
  
  // const db = firebase.database();
  
  // Create or Update (PUT)
  // const accountsDb = db.ref('accounts');
  // accountsDb.set({
  //   property1: "Test",
  //   property2: "testing..."
  // });
  
  // db.ref("new-keys").set({test: "test"});
  // db.ref("new-keys-2").set({test: "testing..."});
  
  // const massUpdate = {};
  // massUpdate['/new-keys-zz'] = {test: "lolol"};
  // massUpdate['/new-keys-2-zz'] = {test: "lololol..."};
  // console.log(massUpdate);
  
  // const massUpdatez = {
  //   "/new-keys": {test: "test"},
  //   "/new-keys-2": {test: "testing..."}
  // };
  
  // db.ref().update(massUpdate);
  
  // db.ref("accounts/property1").set("lololol");
  
  // const taskId = "-MC8Fx4kQmlyOns9hLQA";
  // db.ref("tasks/" + taskId).remove();
  // db.ref("tasks").child(taskId).remove();
  
  // const newTaskRef = db.ref("tasks").push({
  //   title: "new title"
  // });
  // console.log(newTaskRef.key);
  
  // var newTaskKey = firebase.database().ref().child('tasks').push().key;
  // console.log(newTaskKey);
  
  // firebase.database().ref("tasks").child(newTaskKey).set({
  //   title: "My new task..."
  // });
  
  // firebase.database().ref("tasks").on("value", function(snapshot) {
  //   const data = snapshot.val();
  //   console.log("Repeated: ", data);
  // });
  
  // firebase.database().ref("tasks").once("value", function(snapshot) {
  //   const data = snapshot.val();
  //   console.log("Once: ", data);
  // });
  
  // const url = "https://ix-2020-green-miki.firebaseio.com/tasks.json";
  // fetch(url)
  //   .then((response) => {
  //     response
  //       .json()
  //       .then((data) => {
  //         // const keys = Object.keys(data);
  //         // console.log(keys);
  //         // console.log(data["task-1"]);
  
  //         Object.keys(data).forEach(key => {
  //           const taskData = data[key];
  //           console.log(taskData);
  //           const task = new Task(key, taskData.title);
  //           this.tasks.push(task);
  
  //           const taskListElement = document.getElementById("taskList");
  //           const row = document.createElement("tr");
  //           row.setAttribute("data-task-id", task.id);
  //           row.innerHTML = `
  //           <td>${task.title}</td>
  //           <td><button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button></td>
  //           `;
  //           taskListElement.appendChild(row);
  //         });
  
  //         // const arrTaskData = Object.values(data);
  //       })
  //       .catch((err) => console.log(err));
  //   })
  //   .catch((err) => console.log(err));
  
  // Filter is another higher order function, not to be confused with find
  // const highPrioTasks = arr.filter((task) => task.sortKey == 5 && task.priority == "H");