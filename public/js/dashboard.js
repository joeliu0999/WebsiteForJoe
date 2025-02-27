/* global blogTableSelections, usersTableSelections, imagesTableSelections, alert, XMLHttpRequest */

// uncheck all checkboxes on load and remove all data from selectionsArray(s) and hide Delete-Buttons
document.addEventListener('DOMContentLoaded', () => {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]')
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = false
  }

  // hiding the Delete Buttons
  disableAllDeleteButtons()
  blogTableSelections.splice(0, blogTableSelections.length)
  usersTableSelections.splice(0, usersTableSelections.length)
})

// adds individual row to selections array
const checkboxClickHandler = (id, tableId, selectionsArray) => { // eslint-disable-line
  const headerCheckboxInputElement = document.querySelector(`#${tableId} thead tr input`)

  const rowsArray = document.querySelectorAll(`#${tableId} tbody .data-row`)

  const idIndex = selectionsArray.indexOf(id)

  // Element already in array, uncheck it.
  if (idIndex !== -1) {
    headerCheckboxInputElement.checked = false
    selectionsArray.splice(idIndex, 1)
    return
  }

  // Element not in array, check it.
  selectionsArray.push(id)
  if (rowsArray.length === selectionsArray.length) {
    headerCheckboxInputElement.checked = true
  }
}

// adds all table rows to selections array / removes all
const selectAllCheckboxClickHandler = (tableId, selectionsArray) => { // eslint-disable-line
  const rowsArray = document.querySelector(`#${tableId} tbody`).getElementsByClassName('data-row')

  // if all are selected: remove and uncheck all
  if (selectionsArray.length === rowsArray.length) {
    selectionsArray.splice(0, selectionsArray.length)
    for (let i = 0; i < rowsArray.length; i++) {
      rowsArray[i].querySelector('input').checked = false
    }
    return
  }

  // add all rows that aren't selected
  for (let i = 0; i < rowsArray.length; i++) {
    const rowId = rowsArray[i].id

    // don't add row if it's already selected
    if (selectionsArray.indexOf(rowId) !== -1) continue

    selectionsArray.push(rowId)

    // set checkbox to checked
    rowsArray[i].querySelector('input').checked = true
  }
}

// Function to check if any of the item is selected
const checkSelection = (tableId) => {
  const rowsArray = document.querySelector(`#${tableId} tbody`).getElementsByClassName('data-row')

  // if all are selected: remove and uncheck all
  for (let i = 0; i < rowsArray.length; i++) {
    if (rowsArray[i].querySelector('input').checked === true) { return true }
  }
  return false
}

// function to determine the visiblity of delete button
const deleteButtonVisibility = (tableId, buttonId) => {
  const deleteButton = document.querySelector('#' + buttonId)
  // if no item is selected the delete button is hidden
  if (!checkSelection(tableId)) {
    deleteButton.style.visibility = 'hidden'
  }
  // if any of the item is selected the delete button is made visible
  if (checkSelection(tableId)) {
    deleteButton.style.visibility = 'visible'
  }
}

// function to disable or hide all the delete buttons
const disableAllDeleteButtons = () => {
  deleteButtonVisibility('blog-table', 'delete-button-blog')
  deleteButtonVisibility('blog-table', 'delete-button-users')
  deleteButtonVisibility('images-table', 'delete-button-images')
}

const deleteHandler = async (route) => { // eslint-disable-line
  let selections
  let itemDesc
  switch (route) {
    case 'users':
      selections = usersTableSelections
      itemDesc = 'user'
      break
    case 'blog':
      selections = blogTableSelections
      itemDesc = 'article'
      break
    case 'image':
      selections = imagesTableSelections
      itemDesc = 'image'
      break
    default:
      console.log('deleteHandler: invalid selection')
      return
  }

  const promise = new Promise((resolve, reject) => {
    let resolved = 0
    let failed = 0
    for (let i = 0; i < selections.length; i++) {
      const XHR = new XMLHttpRequest()

      XHR.onreadystatechange = () => {
        if (XHR.readyState === 4) {
          if (XHR.status !== 200) {
            alert(`Failed to delete a(n) ${itemDesc}. ERROR: ${JSON.parse(XHR.responseText).error}`)
            failed++
          }
          resolved++
        }
      }

      XHR.open('delete', `/api/${route}/${selections[i]}`)
      XHR.withCredentials = true
      XHR.setRequestHeader('Content-Type', 'application/json')
      XHR.send()
    }

    let attempts = 0
    const intrvl = setInterval(() => {
      if (resolved === selections.length) {
        clearInterval(intrvl)
        resolve(failed)
      }

      if (attempts === 5) {
        clearInterval(intrvl)
        reject(new Error('Operation Timed Out'))
      }

      attempts++
    }, 300)
  })

  promise.then((failed) => {
    const deleted = selections.length - failed
    alert(`Succesfully deleted ${deleted} ${itemDesc}(s).`)
    window.location.reload()
  }, () => {
    alert('Operation timed out. Please try again. ')
    window.location.reload()
  }).catch(error => {
    alert(error)
    window.location.reload()
  })
}
