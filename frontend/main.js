/**
  Name: Andrey Butenko
  Date: April 21, 2019
  Section: CSE 154 AI
  This is the main.js script for Doala, a todo list app. It supports multiple lists and
  keyboard shortcuts.
 */

(function() {
  'use strict';

  const DEFAULT_TASKS = [
    [
      { checked: true, text: 'Study for comp sci exam' },
      { checked: true, text: 'Finish English paper' },
      { checked: false, text: 'Study for Oceanography midterm' },
      { checked: false, text: 'Complete readings' }
    ],
    [
      { checked: false, text: 'Sunday - visit the Cat Cafe' },
      { checked: true, text: 'Saturday - watch Spider Man with family' },
      { checked: true, text: 'Friday - play Mario Party with friends' }
    ]
  ];

  const DEFAULT_LIST_NAMES = ['154 Tasks', 'Birthday Weekend'];

  const MARK_ALL_COMPLETE_DELAY_MS = 250;

  let currListIndex = 0;
  let tasks = [];
  let listNames = [];
  tasks[currListIndex] = [];

  /** Save current tasks and task lists to local storage. */
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('listnames', JSON.stringify(listNames));
  }

  /** Load tasks and task lists from local storage. If nothing is stored, use demo lists. */
  function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks')) || DEFAULT_TASKS;
    listNames = JSON.parse(localStorage.getItem('listnames')) || DEFAULT_LIST_NAMES;
  }

  /**
   * Listener that updates the tasks object and saves to local storage when the tasks are
   * edited in the DOM (text input change, checkbox change).
   * @param {Event} e Event object from event listener (text input change, checkox change).
   */
  function onTaskUpdate(e) {
    const taskElement = e.target.parentElement;
    const taskIndex = taskElement.getAttribute('data-task-index');
    const checked = taskElement.querySelector('input[type="checkbox"]').checked;
    const text = taskElement.querySelector('input[type="text"]').value;

    if (checked) {
      taskElement.classList.add('complete');
    } else {
      taskElement.classList.remove('complete');
    }

    tasks[currListIndex][taskIndex] = {
      checked,
      text
    };

    saveTasks();
  }

  /**
   * Listener that deletes a task if it loses focus and has no content.
   * @param {Event} e Event object from event listener (textinput blur).
   */
  function onTaskBlur(e) {
    const taskElement = e.target.parentElement;
    const taskIndex = taskElement.getAttribute('data-task-index');
    const text = taskElement.querySelector('input[type="text"]').value;

    if (text.length === 0) {
      deleteTask(taskIndex);
    }
  }

  /**
   * Swap positions of two task lists in both the tasks object and the DOM.
   * @param {number} index1 List index for swapping.
   * @param {number} index2 List index for swapping.
   */
  function swapTabs(index1, index2) {
    if (document.querySelectorAll('#todo-tabs input[type="text"]').length > 0) {
      return;
    }
    [tasks[index1], tasks[index2]] = [tasks[index2], tasks[index1]];
    [listNames[index1], listNames[index2]] = [listNames[index2], listNames[index1]];

    document.querySelector(`[data-tab-index="${index1}"] button`).innerHTML = listNames[index1];
    document.querySelector(`[data-tab-index="${index2}"] button`).innerHTML = listNames[index2];

    saveTasks();
  }

  /**
   * Swap positions of two task items in both the tasks object and the DOM.
   * No effect if either index is out-of-bounds or if both indices are equal.
   * @param {number} index1 Task index for swapping.
   * @param {number} index2 Task index for swapping.
   */
  function swapTasks(index1, index2) {
    const currList = tasks[currListIndex];
    const minIndex = Math.min(index1, index2);
    const maxIndex = Math.max(index1, index2);

    if (minIndex < 0 || minIndex === maxIndex || maxIndex >= currList.length) {
      return;
    }

    [currList[minIndex], currList[maxIndex]] = [currList[maxIndex], currList[minIndex]];

    const minNode = document.querySelector(`[data-task-index="${minIndex}"]`);
    const maxNode = document.querySelector(`[data-task-index="${maxIndex}"]`);
    minNode.setAttribute('data-task-index', maxIndex);
    maxNode.setAttribute('data-task-index', minIndex);

    const listNode = document.getElementById('todo-list');
    listNode.insertBefore(maxNode, document.querySelector(`[data-task-index="${minIndex - 1}"]`));
    listNode.insertBefore(minNode, document.querySelector(`[data-task-index="${maxIndex - 1}"]`));

    saveTasks();
  }

  /**
   * Get a task element that can be inserted into the DOM.
   * If no task is passed, returns a task element in default state (not checked, no text).
   * @param {number} taskIndex Task index of task.
   * @param {Object} [task] Optional object containing checked state and text value.
   * @return {HTMLElement} Task element.
   */
  function getTaskElement(taskIndex, task = { checked: false, text: '' }) {
    const taskElement = document.createElement('article');
    taskElement.classList.add('task');
    taskElement.setAttribute('data-task-index', taskIndex);

    const taskCheckbox = document.createElement('input');
    taskCheckbox.type = 'checkbox';
    taskCheckbox.addEventListener('click', onTaskUpdate);
    if (task.checked) {
      taskCheckbox.setAttribute('checked', null);
      taskElement.classList.add('complete');
    }

    const taskText = document.createElement('input');
    taskText.type = 'text';
    taskText.placeholder = 'Empty task';
    taskText.addEventListener('input', onTaskUpdate);
    taskText.addEventListener('blur', onTaskBlur);
    taskText.value = task.text;

    taskElement.appendChild(taskCheckbox);
    taskElement.appendChild(taskText);

    return taskElement;
  }

  /**
   * Get a tab button element that can be inserted into the DOM.
   * @param {number} tabIndex Tab index of tab.
   * @return {HTMLElement} Tab button element.
   */
  function getTabButtonElement(tabIndex) {
    const newTabButton = document.createElement('button');
    newTabButton.innerHTML = listNames[tabIndex];
    newTabButton.addEventListener('click',
      e => switchToList(parseInt(e.target.parentElement.getAttribute('data-tab-index'))));
    newTabButton.addEventListener('dblclick',
      e => editTab(parseInt(e.target.parentElement.getAttribute('data-tab-index'))));

    return newTabButton;
  }

  /**
   * Listener that looks at key presses to detect keyboard shortcuts, and runs the corresponding
   * operation.
   * @param {Event} e Event object from keypress listener.
   */
  function onKeyPress(e) {
    const taskElement = document.activeElement.parentElement;
    const taskIndex = parseInt(taskElement.getAttribute('data-task-index'));
    const isTaskActive = taskElement.classList.contains('task');

    // Deleting items on list
    if (isTaskActive && e.key === 'Backspace' && e.ctrlKey) {
      deleteTask(taskIndex);
      if (taskIndex > 0) {
        document.querySelector(`[data-task-index="${taskIndex - 1}"] input[type="text"]`).focus();
      } else if (tasks[currListIndex].length > 0) {
        document.querySelector(`[data-task-index="${taskIndex}"] input[type="text"]`).focus();
      }

      // Keep the preventDefault! Or else when previous input is focused, backspace will delete
      e.preventDefault();
    }
    if (isTaskActive && e.key === 'Backspace' && !e.ctrlKey
      && document.activeElement.selectionStart === 0
    ) {
      deleteTask(taskIndex);
      if (taskIndex > 0) {
        document.querySelector(`[data-task-index="${taskIndex - 1}"] input[type="text"]`).focus();
      } else if (tasks[currListIndex].length > 0) {
        document.querySelector(`[data-task-index="${taskIndex}"] input[type="text"]`).focus();
      }

      // Keep the preventDefault! Or else when previous input is focused, backspace will delete
      e.preventDefault();
    }

    // Moving items on list
    if (isTaskActive && e.key === 'ArrowUp' && e.ctrlKey) {
      swapTasks(taskIndex + 1, taskIndex);
    }
    if (isTaskActive && e.key === 'ArrowDown' && e.ctrlKey) {
      swapTasks(taskIndex, taskIndex - 1);
    }

    // Traversing items on list
    if (isTaskActive && e.key === 'ArrowUp' && taskIndex < tasks[currListIndex].length - 1) {
      document.querySelector(`[data-task-index="${taskIndex + 1}"] input[type="text"]`).focus();
    }
    if (isTaskActive && e.key === 'ArrowDown' && taskIndex > 0) {
      document.querySelector(`[data-task-index="${taskIndex - 1}"] input[type="text"]`).focus();
    }

    // Marking items done
    if (isTaskActive && e.key === 'Enter' && e.ctrlKey) {
      taskElement.querySelector('input[type="checkbox"]').click();
    }

    // Reorganizing lists
    if (e.key === 'ArrowLeft' && e.shiftKey && e.ctrlKey && currListIndex > 0) {
      swapTabs(currListIndex, currListIndex - 1);
    }
    if (e.key === 'ArrowRight' && e.shiftKey && e.ctrlKey && currListIndex < tasks.length - 1) {
      swapTabs(currListIndex, currListIndex + 1);
    }

    // Moving between lists
    if (e.key === 'ArrowLeft' && e.ctrlKey) {
      switchToList(currListIndex - 1);
    }
    if (e.key === 'ArrowRight' && e.ctrlKey) {
      switchToList(currListIndex + 1);
    }

    // Other
    if (e.key === '.' && e.ctrlKey) {
      toggleDarkMode();
    }
    if (e.key === '/' && e.ctrlKey) {
      toggleAbout();
    }

    // Adding items
    if (e.key === 'Enter' && !e.ctrlKey) {
      addTask();
    }
  }

  /** Add a new empty task in both the tasks object and the DOM. */
  function addTask() {
    const newElement = getTaskElement(tasks[currListIndex].length);
    document.getElementById('todo-list').prepend(newElement);
    newElement.querySelector('input[type="text"]').focus();
    tasks[currListIndex].push({ complete: false, text: '' });
  }

  /**
   * Add a new task with provided information in both the tasks object and the DOM.
   * @param {number} taskIndex Task index of task.
   * @param {Object} task Task object of task. Must contain checked and text keys.
   */
  function addPrepopulatedTask(taskIndex, task) {
    const newElement = getTaskElement(taskIndex, task);
    document.getElementById('todo-list').prepend(newElement);
    newElement.querySelector('input[type="text"]').focus();
  }

  /**
   * Delete the task at the given index in both the tasks object and the DOM.
   * @param {number} taskIndex Task index of task to delete.
   */
  function deleteTask(taskIndex) {
    const toDeleteTaskElement = document.querySelector(`[data-task-index="${taskIndex}"]`);
    for (let i = taskIndex + 1; i < tasks[currListIndex].length; i++) {
      const taskElement = document.querySelector(`[data-task-index="${i}"`);
      taskElement.setAttribute('data-task-index', i - 1);
    }
    tasks[currListIndex].splice(taskIndex, 1);
    document.getElementById('todo-list').removeChild(toDeleteTaskElement);

    saveTasks();
  }

  /**
   * Display the given task list, and scrolls to its position if appropriate.
   * If the listIndex is less than zero, does nothing.
   * If the listIndex is the "next" list but the new list has not yet been created and the previous
   * list contains items, creates a new task list in both the tasks object and the DOM.
   * @param {number} listIndex Index of list to display.
   */
  function switchToList(listIndex) {
    if (listIndex < 0
      || (listIndex === tasks.length && tasks[currListIndex].length === 0)
    ) {
      return;
    }

    currListIndex = listIndex;
    if (tasks.length <= listIndex) {
      tasks[listIndex] = [];
      listNames[listIndex] = `List ${listIndex + 1}`;
      addTab(listIndex);
    }

    recalculateTabStateDOM();
    recalculateTabScroll();

    document.querySelector('title').innerHTML = `${listNames[listIndex]} - Doala`;

    repopulateDOMTasks();
  }

  /** Update classes of tabs in DOM so that only the selected tab has the selected class. */
  function recalculateTabStateDOM() {
    for (let i = 0; i < tasks.length; i++) {
      const tabListItem = document.querySelector(`[data-tab-index="${i}"]`);
      if (i === currListIndex) {
        tabListItem.classList.add('selected');
      } else {
        tabListItem.classList.remove('selected');
      }
    }
  }

  /** Scroll to tab if currently-selected tab button is outside of the viewport. */
  function recalculateTabScroll() {
    const tabsNode = document.getElementById('todo-tabs');
    const selectedTabListItem = document.querySelector(`[data-tab-index="${currListIndex}"]`);
    if (selectedTabListItem.offsetLeft + selectedTabListItem.clientWidth >
      tabsNode.clientWidth + tabsNode.scrollLeft
    ) {
      scrollTabList(1);
    }

    if (selectedTabListItem.offsetLeft - selectedTabListItem.clientWidth < tabsNode.scrollLeft) {
      scrollTabList(-1);
    }
  }

  /**
   * Add a new tab element to the DOM.
   * @param {number} tabIndex Tab index of the list.
   * @param {boolean} selected Is tab currently selected.
   */
  function addTab(tabIndex, selected) {
    const newListElement = document.createElement('li');
    newListElement.setAttribute('data-tab-index', tabIndex);
    if (selected) {
      newListElement.classList.add('selected');
    }

    newListElement.appendChild(getTabButtonElement(tabIndex));

    document.getElementById('todo-tabs').appendChild(newListElement);

    recomputeTabScroll();
  }

  /**
   * Enable editing for a tab so that the user can rename it.
   * @param {number} tabIndex Tab index of the list to edit.
   */
  function editTab(tabIndex) {
    const tabListItem = document.querySelector(`[data-tab-index="${tabIndex}"]`);
    const tabButton = tabListItem.querySelector(`button`);

    const newInputItem = document.createElement('input');
    newInputItem.addEventListener('blur', onCompleteEditTab);
    newInputItem.type = 'text';
    newInputItem.setAttribute('data-tab-index', tabIndex);
    newInputItem.value = listNames[tabIndex];

    tabListItem.replaceChild(newInputItem, tabButton);
    newInputItem.focus();
  }

  /**
   * Listener that disables editing for a tab and updates its name in the tab object when it loses
   * focus.
   * @param {Event} e Event object from event listener (textinput blur).
   */
  function onCompleteEditTab(e) {
    const tabInput = e.target;
    const tabListItem = tabInput.parentElement;
    const tabIndex = parseInt(tabListItem.getAttribute('data-tab-index'));
    listNames[tabIndex] = tabInput.value || `List ${tabIndex + 1}`;

    tabListItem.replaceChild(getTabButtonElement(tabIndex), tabInput);

    saveTasks();
    switchToList(tabIndex);
  }

  /** Insert tab elements into the DOM for each task list. */
  function repopulateDOMTabs() {
    const tabsNode = document.getElementById('todo-tabs');
    while (tabsNode.lastChild) {
      tabsNode.removeChild(tabsNode.lastChild);
    }

    tasks.forEach((taskList, taskListIndex) => {
      addTab(taskListIndex, taskListIndex === 0);
    });

    recomputeTabScroll();
  }

  /** Insert task elements into the DOM for each task in the current list. */
  function repopulateDOMTasks() {
    const listNode = document.getElementById('todo-list');
    listNode.innerHTML = '';

    const currList = tasks[currListIndex];
    currList.forEach((task, taskIndex) => {
      addPrepopulatedTask(taskIndex, task);
    });
  }

  /**
   * Smoothly scroll tab list if it is too wide to fit in the viewport.
   * By default, scrolls to the right by half the width of the tab container. Can scroll the
   * opposite direction or further if a scrollFactor is provided.
   * @param {number} [scrollFactor = 1] Factor by which to magnify/reflect the scrolling.
  */
  function scrollTabList(scrollFactor = 1) {
    const tabsNode = document.getElementById('todo-tabs');
    tabsNode.scrollBy({
      left: scrollFactor * tabsNode.clientWidth / 2,
      top: 0,
      behavior: 'smooth'
    });
  }

  /** Show or hide tab container scrolling buttons based on how wide the number of tabs. */
  function recomputeTabScroll() {
    const tabsNode = document.getElementById('todo-tabs');
    if (tabsNode.clientWidth === tabsNode.scrollWidth) {
      document.querySelector('header').classList.add('hide-tab-scroll');
    } else {
      document.querySelector('header').classList.remove('hide-tab-scroll');
    }
  }

  /** Toggle dark color scheme. */
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
  }

  /** Mark all list items on current list complete one at a time. */
  function markAllComplete() {
    const listIndex = currListIndex;
    const interval = setInterval(() => {
      const notComplete = tasks[listIndex]
        .map((task, taskIndex) => (Object.assign(task, { taskIndex })))
        .filter(task => !task.checked);
      if (notComplete.length === 0) {
        clearInterval(interval);
      } else {
        const taskIndex = notComplete[notComplete.length - 1].taskIndex;
        document.querySelector(`[data-task-index="${taskIndex}"] input[type="checkbox"]`).click();
      }
    }, MARK_ALL_COMPLETE_DELAY_MS);
  }

  /** Toggle visibility of "about" modal. */
  function toggleAbout() {
    document.getElementById('about-modal').classList.toggle('dismissed');
  }

  /** Set up listeners as well as load tasks and preferences. */
  function onLoad() {
    document.addEventListener('keydown', onKeyPress);
    document.getElementById('add-task').addEventListener('click', addTask);
    document.getElementById('toggle-dark').addEventListener('click', toggleDarkMode);
    document.getElementById('close-modal').addEventListener('click', toggleAbout);
    document.getElementById('show-about').addEventListener('click', toggleAbout);
    document.getElementById('complete-all').addEventListener('click', markAllComplete);
    document.getElementById('tab-scroll-left').addEventListener('click', () => scrollTabList(-1));
    document.getElementById('tab-scroll-right').addEventListener('click', () => scrollTabList(1));

    window.addEventListener('resize', recomputeTabScroll);

    loadTasks();
    repopulateDOMTasks();
    repopulateDOMTabs();

    switchToList(0);

    // Note: values stored as booleans into localStorage may be returned as strings
    const useDarkMode = localStorage.getItem('dark-mode');
    if (useDarkMode === 'true' || useDarkMode === true) {
      toggleDarkMode();
    }

    // Note: values stored as booleans into localStorage may be returned as strings
    const returningUser = localStorage.getItem('returning-user');
    if (returningUser !== 'true' && returningUser !== true) {
      toggleAbout();
      localStorage.setItem('returning-user', true);
    }
  }

  window.addEventListener('load', onLoad);
})();