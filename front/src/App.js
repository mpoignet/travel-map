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
        {
          suggestions.map((suggestion, index) => {
            return <option key={index} value={suggestion}></option>
          })
        }
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
  const [modalIsOpen, setIsOpen] = useState(false)
  const [currentMapId, setCurrentMapId] = useState(null)
  function openModal () {
    setIsOpen(true)
  }
  // function afterOpenModal () {
  // }
  function changeCurrentMapId (mapId) {
    setCurrentMapId(mapId)
  }
  function closeModal () {
    setIsOpen(false)
  }
  return (
    <div id="panel-controls">
      <button id="clear-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => props.mappingClient.clearMap()}>Clear</button>
      <button id="save-btn" className="panel-btn panel-btn--standalone"
      onClick={ () => props.mappingClient.saveMap(currentMapId)}>Save</button>
      <button id="load-btn" className="panel-btn panel-btn--standalone"
      onClick={openModal}>Load</button>
      <LoadingModal isOpen={modalIsOpen} onClose={closeModal}
      mappingClient={props.mappingClient} user=""
      changeCurrentMapId = {changeCurrentMapId} />
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
    props.changeCurrentMapId(mapId)
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
