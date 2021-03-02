import React from 'react'
import ReactDOM from 'react-dom'
import MappingClient from './mappingClient.js'
import 'normalize.css'
import '@fortawesome/fontawesome-free/js/all.js'
import './style.css'
import App from './App.js'
ReactDOM.render(<App />, document.getElementById('root'))

const SEARCH_INPUT_ID = 'search-input'
const SEARCH_BTN_ID = 'search-btn'
const ROUTE_BTN_ID = 'route-btn'
const CLEAR_BTN_ID = 'clear-btn'
const SAVE_BTN_ID = 'save-btn'
const LOAD_BTN_ID = 'load-btn'

window.onload = function () {
  const mappingClient = new MappingClient('map')

  document.getElementById(SEARCH_INPUT_ID).addEventListener('keyup', (e) => {
    const textToSearch = document.getElementById(SEARCH_INPUT_ID).value
    const dataList = document.getElementById('suggestions')
    dataList.innerHTML = ''

    // Test for Enter key
    if (e.keyCode === 13) {
      mappingClient.plotPointFromText(textToSearch)
    } else if (textToSearch.length > 3) {
      mappingClient.getAutocomplete(textToSearch, (suggestions) => {
        console.debug('Results of autocomplete: ')
        console.debug(suggestions)
        suggestions.forEach((suggestion) => {
          const option = document.createElement('option')
          option.value = suggestion
          dataList.appendChild(option)
        })
      })
    }
  })

  document.getElementById(SAVE_BTN_ID).addEventListener('click', (e) => {
    mappingClient.saveMap()
  })

  document.getElementById(LOAD_BTN_ID).addEventListener('click', (e) => {
    mappingClient.clearMap()
    mappingClient.loadMap()
  })

  document.getElementById(CLEAR_BTN_ID).addEventListener('click', (e) => {
    mappingClient.clearMap()
  })

  document.getElementById(SEARCH_BTN_ID).addEventListener('click', (e) => {
    mappingClient.plotPointFromText(
      document.getElementById(SEARCH_INPUT_ID).value
    )
  })

  document.getElementById(ROUTE_BTN_ID).addEventListener('click', (e) => {
    mappingClient.plotPointFromText(
      document.getElementById(SEARCH_INPUT_ID).value
    )
    switchSearchToRoute()
  })

  function switchSearchToRoute () {
    changeSearchLine()
    addDestinationToPanel()
  }

  function changeSearchLine () {
    document.getElementById('search-btn').remove()
    document.getElementById('route-btn').remove()
    document.getElementById('search-line-1').appendChild(createSearchButton())
    document.getElementById('add-btn').innerHTML = 'Add Route'
  }

  function addDestinationToPanel () {
    const searchLine = document.createElement('div')
    searchLine.className += 'search-line'
    searchLine.id = 'search-line-2'
    const searchInput = document.createElement('input')
    searchInput.setAttribute('type', 'text')
    searchInput.className = 'panel-input'
    searchLine.appendChild(searchInput)
    const dataList = document.createElement('datalist')
    searchLine.appendChild(dataList)
    const button = createSearchButton()
    button.addEventListener('click', function (e) {
      mappingClient.plotRouteFromText(
        document.getElementById(SEARCH_INPUT_ID).value,
        searchInput.value
      )
    })
    searchLine.appendChild(button)
    document.getElementById('search-lines').appendChild(searchLine)
  }

  function createSearchButton () {
    const button = document.createElement('button')
    button.id = 'destination-btn'
    button.className = 'panel-btn'
    button.className += ' panel-btn--icon'
    const icon = document.createElement('i')
    icon.className += 'fas fa-search'
    button.appendChild(icon)
    return button
  }
}
