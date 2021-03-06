import React, { useEffect, useState } from 'react'
import Modal from 'react-modal'
import MappingClient from './mappingClient.js'
import './style.css'

Modal.setAppElement('#root')

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
              <SearchLine index={0} mappingClient={props.mappingClient} routeBtn={false}/>
              <SearchLine index={1} mappingClient={props.mappingClient} routeBtn={false}/>
            </div>
          : <SearchLine index={0} mappingClient={props.mappingClient} routeBtn={true} toggleRouteMode={toggleRouteMode}/>
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
  const [suggestionSet, setSuggestionSet] = useState({})
  const [lastKeyPressed, setLastKeyPressed] = useState(undefined)

  const handleChange = (e) => {
    setSearchText(e.target.value)
  }
  const handleKeyUp = (e) => {
    // If no key code, then the event was triggered by selecting an option
    if (!e.keyCode) {
      return
    }
    // Test for Enter key
    if (e.keyCode === 13) {
      props.mappingClient.searchAndAddMarker(searchText)
      return
    }
    if (searchText.length > 3) {
      props.mappingClient.getAutocomplete(searchText, (newSuggestions) => {
        console.debug('Results of autocomplete: ')
        console.debug(newSuggestions)
        setSuggestionSet(newSuggestions)
      })
    }
  }

  const handleKeyDown = (e) => {
    setLastKeyPressed(e.keyCode)
  }

  const handleSearchBtnClick = (e) => {
    props.mappingClient.searchAndAddMarker(searchText)
  }

  const handleInput = (e) => {
    // Option selected from the datalist of suggestions
    if (!lastKeyPressed) {
      const option = e.target.value
      console.debug('option selected: ' + option)
      props.mappingClient.addMarker(option, suggestionSet[option])
    }
  }

  const datalistId = 'suggestions-' + props.index

  return (
    <div className="search-line">
      <input type="text" className="panel-input" list={datalistId}
      value={searchText} onChange={ (e) => handleChange(e) }
      onKeyDown={ (e) => handleKeyDown(e) }
      onKeyUp={ (e) => handleKeyUp(e) }
      onInput={ (e) => handleInput(e) } />
      <datalist id={datalistId}>
        {
          Object.keys(suggestionSet).map((suggestion, index) => {
            return <option key={'suggestion-' + props.index + '-' +index} value={suggestion}></option>
          })
        }
      </datalist>
      <SearchButton onClick= { (e) => handleSearchBtnClick(e) } />
      {
        props.routeBtn &&
        <button className="panel-btn panel-btn--icon"
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
  const [modalIsOpen, setIsOpen] = useState(false)
  function openModal () {
    setIsOpen(true)
  }
  function closeModal () {
    setIsOpen(false)
  }
  return (
    <div id="panel-controls">
      <button id="clear-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => props.mappingClient.clearMap()}>Clear</button>
      <button id="save-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => props.mappingClient.saveMap()}>Save</button>
      <button id="load-btn" className="panel-btn panel-btn--standalone"
      onClick={openModal}>Load</button>
      <LoadingModal isOpen={modalIsOpen} onClose={closeModal}
      mappingClient={props.mappingClient} user="" />
    </div>
  )
}

const modalStyles = {
  overlay: {
    zIndex: '1000'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  }
}

function LoadingModal (props) {
  const [maps, setMaps] = useState([])
  useEffect(() => {
    props.mappingClient.getMaps((maps) => setMaps(maps))
  }, [props.user])
  const loadMap = (mapId) => {
    props.mappingClient.clearMap()
    props.mappingClient.loadMap(mapId)
    props.onClose()
  }
  return (
    <Modal
      isOpen={props.isOpen}
      // onAfterOpen={afterOpenModal}
      onRequestClose={props.onClose}
      style={modalStyles}
      contentLabel="Example Modal"
    >
      <h2>Select a map</h2>
        <ul className='mapList'>
        {
          maps.map(map => {
            return <li className='MapListItem' key={map.id}>
                <a onClick={ () => loadMap(map.id)} href='#'>{map.title}</a>
              </li>
          })
        }
        </ul>
      <button onClick={loadMap}>close</button>
      <button onClick={props.onClose}>close</button>
    </Modal>
  )
}

export default App
