var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>")
    .addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);

  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// on click of a <p> element with the "list-group" class focus on and allow editing
$(".list-group").on("click", "p", function() {
  var text = $(this)
    .text()
    .trim();

  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);
  textInput.trigger("focus")
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  active: function(event) {
    $(".bottom-trash").addClass("bottom-trash-drag");
    $(this).addClass("dropover");
  },
  deactivate: function(event) {
    $(".bottom-trash").removeClass("bottom-trash-drag");
    $(this).removeClass("dropover");
  },
  over: function(event) {
    console.log("over", event.target);
  },
  out: function(event) {
    console.log("out", event.target);
  },
  update: function(event) {
    // task data arrray
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      tempArr.push({
        text: text,
        date: date
      });
    });

    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    tasks[arrName] = tempArr;
    saveTasks();
  }
});

$("#modalDueDate").datepicker({
  minDate: 1
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// value of list item was changed
$(".list-group").on("blur", "textarea", function() {
  // get texarea's updated value
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  tasks[status][index].text = text;
  saveTasks();

  // recreate <p> element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  
  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// on click of a <span> element with the "list-group" class focus on and allow editing
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jQuery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // when calendar is closed, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this).val();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and resave to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass list item element into audit task to check new date
  auditTask($(taskSpan).closest(".list-group-item"));
});

var auditTask = function(taskEl) {
  // get date from task element
  var date = $(taskEl)
    .find("span")
    .text()
    .trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove element's old classes
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class for near and overdue tasks
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if(Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, (1000 * 60) * 30);