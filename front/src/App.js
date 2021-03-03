import React, { useEffect, useState } from 'react'
import MappingClient from './mappingClient.js'
import './style.css'

function App () {
  const mappingClient = new MappingClient()

  useEffect(() => {
    mappingClient.initMap('map')
  })

  return (
    <div id='wrapper'>
      <Panel mappingClient={mappingClient} />
      <div id="map"></div>
    </div>
  )
}

function Panel (props) {
  return (
    <div id="panel">
      <SearchPanel mappingClient={props.mappingClient} />
      <PanelControls mappingClient={props.mappingClient} />
    </div>
  )
}

function SearchPanel (props) {
  const [routeMode, setRouteMode] = useState(false)
  const toggleRouteMode = () => setRouteMode(!routeMode)
  return (
    <div id="search-panel">
    <div id="search-lines">
      {
        routeMode
          ? <div>
              <SearchLine mappingClient={props.mappingClient} routeBtn={false}/>
              <SearchLine mappingClient={props.mappingClient} routeBtn={false}/>
            </div>
          : <SearchLine mappingClient={props.mappingClient} routeBtn={true} toggleRouteMode={toggleRouteMode}/>
      }
    </div>
      {
        routeMode
          ? <button className="panel-btn" id="add-btn">Add Route</button>
          : <button className="panel-btn" id="add-btn">Add Marker</button>
      }
    </div>
  )
}

function SearchLine (props) {
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const handleChange = (e) => {
    setSearchText(e.target.value)
    if (searchText.length > 3) {
      props.mappingClient.getAutocomplete(searchText, (newSuggestions) => {
        console.debug('Results of autocomplete: ')
        console.debug(newSuggestions)
        setSuggestions(newSuggestions)
      })
    }
  }
  const handleKeyUp = (e) => {
    // Test for Enter key
    if (e.keyCode === 13) {
      props.mappingClient.plotPointFromText(searchText)
    }
  }

  const handleSearchBtnClick = (e) => {
    props.mappingClient.plotPointFromText(searchText)
  }

  return (
    <div className="search-line" id="search-line-1">
      <input type="text" id="search-input" className="panel-input" list="suggestions"
      value={searchText} onChange={ (e) => handleChange(e) }
      onKeyUp={ (e) => handleKeyUp(e) } />
      <datalist id="suggestions">
        {suggestions.map((suggestion, index) => {
          return <option key={index} value={suggestion}></option>
        })}
      </datalist>
      <SearchButton onClick= { (e) => handleSearchBtnClick(e) } />
      {
        props.routeBtn &&
        <button id="route-btn" className="panel-btn panel-btn--icon"
        onClick={ props.toggleRouteMode }>
        <i className="fas fa-directions"></i>
        </button>
      }
    </div>
  )
}

function SearchButton (props) {
  return (
    <button id="search-btn" className="panel-btn panel-btn--icon"
    onClick={ (e) => props.onClick(e) }>
    <i className="fas fa-search"></i>
    </button>
  )
}

function PanelControls (props) {
  return (
    <div id="panel-controls">
      <button id="clear-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => props.mappingClient.clearMap()}>Clear</button>
      <button id="save-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => props.mappingClient.saveMap()}>Save</button>
      <button id="load-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => {
        props.mappingClient.clearMap()
        props.mappingClient.loadMap()
      }}>Load</button>
    </div>
  )
}

export default App
