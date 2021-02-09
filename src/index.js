import MappingClient from './mappingClient.js'
import "normalize.css"
import '@fortawesome/fontawesome-free/js/all.js';
import './style.css';

const SEARCH_INPUT_ID = "search-input";
const SEARCH_BTN_ID = "search-btn";
const ROUTE_BTN_ID = "route-btn";
const CLEAR_BTN_ID = "clear-btn";

window.onload = function () {
  const mappingClient = new MappingClient("map");

  document.getElementById(SEARCH_INPUT_ID).addEventListener("keyup", (e) => {
    let textToSearch = document.getElementById(SEARCH_INPUT_ID).value;
    let dataList = document.getElementById("suggestions");
    dataList.innerHTML = "";

    // Test for Enter key
    if (e.keyCode == 13) {
      mappingClient.plotPointFromText(textToSearch);
    } else if (textToSearch.length > 3) {
      mappingClient.getAutocomplete(textToSearch, (suggestions) => {
        console.debug("Results of autocomplete: ");
        console.debug(suggestions);
        suggestions.forEach((suggestion) => {
          const option = document.createElement("option");
          option.value = suggestion;
          dataList.appendChild(option);
        });
      });
    }
  });

  document.getElementById(CLEAR_BTN_ID).addEventListener("click", (e) => {
    mappingClient.clearMap();
  });

  document.getElementById(SEARCH_BTN_ID).addEventListener("click", (e) => {
    mappingClient.plotPointFromText(
      document.getElementById(SEARCH_INPUT_ID).value
    );
  });

  document.getElementById(ROUTE_BTN_ID).addEventListener("click", (e) => {
    mappingClient.plotPointFromText(
      document.getElementById(SEARCH_INPUT_ID).value
    );
    addDestinationToPanel();
  });

  function addDestinationToPanel() {
    const searchLine = document.createElement("div");
    searchLine.className += "search-line";
    const searchInput = document.createElement("input");
    searchInput.setAttribute("type", "text");
    searchInput.className = "panel-input";
    searchLine.appendChild(searchInput);
    const dataList = document.createElement("datalist");
    searchLine.appendChild(dataList);
    const button = document.createElement("button");
    button.id = "destination-btn";
    button.className = "panel-btn";
    const icon = document.createElement("i");
    icon.className += "fas fa-directions";
    button.appendChild(icon);
    button.addEventListener("click", function (e) {
      mappingClient.plotRouteFromText(
        document.getElementById(SEARCH_INPUT_ID).value,
        searchInput.value
      );
    });
    searchLine.appendChild(button);
    document.getElementById("panel").appendChild(searchLine);
  }
};
