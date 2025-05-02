let width = 800, height = 550;

let svg = d3.select("svg")
    // resizing of svg element
    .attr("viewBox", "0 0 " + (width) + " " + (height));

function toTitleCase(string) {
    return string
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function domParser(string) {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(string, 'text/html');

    // Get all rows after the header row
    const rows = Array.from(doc.querySelectorAll('table tr')).slice(1);

    const attributes = {};

    rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td) {
            attributes[th.textContent.trim()] = td.textContent.trim();
        }
    });
    return attributes
}

function removeAttr(data, attribute) {
    const removeKeys = [attribute];

    const cleaned = data.map(obj =>
    Object.fromEntries(
        Object.entries(obj).filter(([key]) => !removeKeys.includes(key))
    ));
    return cleaned;
}

// Function to draw pie chart
function drawPieChart(ageGroupData, subzoneName) {
    const svg = d3.select("#pieChart");
    svg.selectAll("*").remove(); // Clear previous chart
    const lgd = d3.select("#legend_chart");
    lgd.selectAll("*").remove();
  
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const radius = Math.min(width, height) / 2;
  
    const g = svg.append("g")
      .attr("transform", `translate(${width / 1.5}, ${height / 2 + 20})`);

    const colorMap = {
        "Below 20 Years": "rgb(255, 174, 241)",
        "20 to 49 Years": "rgb(255, 190, 116)",
        "50 to 64 Years": "rgb(112, 209, 156)",
        "65 Years & Above": "rgb(146, 173, 255)"
    };
  
    const pie = d3.pie().value(d => d[1]);
    const data = Object.entries(ageGroupData[0]); // [ [group, value], ... ]
  
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius); // For slices
    
    // Tooltips for labels
    const tooltip_chart = d3.select("#tooltip_chart");

    // Draw pie slices
    g.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => colorMap[d.data[0]])
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .on("mouseover", (event, d) => {
        tooltip_chart
        .style("display", "block")
        .html(`<strong>${d.data[0]}</strong>: ${d.data[1].toLocaleString()}`);
    })
    .on("mousemove", (event) => {
        tooltip_chart
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
        tooltip_chart.style("display", "none");
    });
  
    // Add a title above the pie chart
    svg.append("text")
      .attr("x", width / 1.5)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("font-family", "Cambria")
      .text(`Age Group Distribution: ${subzoneName}`);

    // Percentage labels
    const total_pop = d3.sum(data, d => d[1]);
    g.selectAll("text")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-family", "Cambria")
      .text(d => {
        const percent = (d.data[1] / total_pop * 100).toFixed(1);
        return `${percent}%`;
      });

    // Legend
    const legend_chart = d3.select("#legend_chart");

    // Add legend title
    legend_chart.append("div")
    .style("margin-bottom", "6px")
    .style("font-weight", "bold")
    .style("font-size", "18px")
    .text("Age Groups");

    Object.entries(colorMap).forEach(([label, color]) => {
    const row = legend_chart.append("div").style("display", "flex");

    row.append("div")
        .style("width", "20px")
        .style("height", "20px")
        .style("background-color", color)
        .style("margin-right", "8px");

    row.append("span").text(label);
    });
}

function clearPieChart(message) {
    const svg = d3.select("#pieChart");
    svg.selectAll("*").remove();
    const lgd = d3.select("#legend_chart");
    lgd.selectAll("*").remove();
  
    svg.append("text")
      .attr("x", svg.attr("width") / 1.5)
      .attr("y", svg.attr("height") / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text(message);
}

// function to append data to table
const colname_map = {
    "SUBZONE_N": "Name of Subzone",
    "NUMPOINTS_clinics": "No. of CHAS clinics",
    "NUMPOINTS_CC": "No. of Community Centres",
    "NUMPOINTS_eldercare": "No. of Eldercare Services"
};

// Rename object keys
const columnsToShow = Object.keys(colname_map);
const renamed_cols = Object.values(colname_map);

function createTable(data) {
    const table = d3.select("#data_table")
      .append("table")
      .attr("class", "custom-table");
  
    // Table header
    const thead = table.append("thead");
    thead.append("tr")
      .selectAll("th")
      .data(renamed_cols)
      .enter()
      .append("th")
      .text(d => d);
  
    // Table body
    const tbody = table.append("tbody");
    data.forEach(row => {
      const tr = tbody.append("tr");
      columnsToShow.forEach(col => {
        tr.append("td")
          .text(row[col]);
      });
    });
}

function clearTable() {
    const svg = d3.select("#data_table");
    svg.selectAll("*").remove();
}

function zoomToSubzone(feature, path) {
    const svg = d3.select("#choro_map");
    const [[x0, y0], [x1, y1]] = path.bounds(feature);
  
    const svgWidth = 800;
    const svgHeight = 550;
  
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
  
    const scale = Math.min(8, 0.9 / Math.max(dx / svgWidth, dy / svgHeight));
    const translate = [svgWidth / 2 - scale * x, svgHeight / 2 - scale * y];
    console.log(svgWidth)
  
    svg.transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
}

function highlightSubzone(selectedElement) {
    const svg = d3.select("#choro_map");
    svg.selectAll("path").classed("selected", false);
    d3.select(selectedElement).classed("selected", true);
}

// Create svg for zoom
const zoomLayer = svg.append("g").attr("id", "zoomLayer");  // zoomable group
const legendLayer = svg.append("g").attr("id", "legendLayer"); // static group

const gMap = zoomLayer.append("g").attr("id", "mapLayer");

// const g = svg.append("g");

// Zoom behavior
const zoom = d3.zoom()
.scaleExtent([1, 8]) // min and max zoom
    .on("zoom", (event) => {
        zoomLayer.attr("transform", event.transform);

        // Rescale points across all layers
        ["clinicsLayer", "ccLayer", "eldercareLayer"].forEach(id => {
            d3.select(`#${id}`).selectAll("circle")
            .attr("r", 5 / event.transform.k)
            .attr("stroke-width", 1 / event.transform.k);
        });
    })
    

svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(-width/3, -height/3).scale(1.6));
      
// Datasets
Promise.all([d3.json("data/MP2019_Subzone_Boundary.geojson"), 
    d3.csv("data/populationData2024.csv"),
    d3.csv("data/szpop_broadagegroup.csv"), 
    d3.json("data/CHASClinics.geojson"),
    d3.json("data/EldercareServices.geojson"),
    d3.json("data/CommunityClubs.geojson"),
    d3.csv("data/MP19_subzone_amenities_count.csv")]
).then(data => {

    let subzoneData = data[0].features;
    let populationData = data[1];
    let szAgeGrpData = data[2];
    let clinicData = data[3].features;
    let eldercareData = data[4].features;
    let ccData = data[5].features;
    let amenityCountData = data[6];

    console.log(amenityCountData);

    subzoneData.forEach(d => {
        attributes = domParser(d.properties.Description)
        let sz = populationData.find(e => e.Subzone.toUpperCase() == attributes.SUBZONE_N);
        d.populationdata = (sz != undefined) ? parseInt(sz.Population) : 0;
        d.subzone_name = attributes.SUBZONE_N;
        d.PA_name = toTitleCase(attributes.PLN_AREA_N);
        d.region_name = toTitleCase(attributes.REGION_N);
    })

    // Map and projection (onto svg space)
    let projection = d3.geoMercator()
    .center([103.851784, 1.287953]) // Singapore's longitude / latitude;
    //.fitExtent([[60, 50], [990, 580]], data[0])
    .scale(50000)
    .translate([width/2, height/2]);
    let geopath = d3.geoPath().projection(projection);

    // 5. Define color scale
    const maxPop = d3.max(subzoneData, d => d.populationdata);
    const color = d3.scaleSequential()
    .domain([0, maxPop])
    .interpolator(d3.interpolateReds);

    // Tooltips
    const tooltip = d3.select("#tooltip");
    const formatComma = d3.format(",");

    /* Title of Chart */
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-color", "black")
        .attr("font-weight", "bold")
        .attr("font-family", "Cambria")
        .text("Singapore's Population (2024) by Subzone");

    // Draw the map
    //svg.append("g")
    //zoomLayer.attr("id", "subzones")
    gMap
        .selectAll("path")
        .data(subzoneData)
        .enter()
        .append("path")
        .attr("d",  d => geopath(d))
        .attr("fill", d => {
            if (d.populationdata === 0) {return "grey"} else {return color(d.populationdata)}})
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
            .on("mouseover", function (event, d) {
                tooltip
                .style("opacity", 1)
                .html(
                    `<strong>${d.subzone_name}</strong><br/>Planning Area: ${d.PA_name} <br/>Region: ${d.region_name} <br/>Population: ${formatComma(d.populationdata)}`
                );
        
                d3.select(event.currentTarget)
                .style("fill", "yellow")
                //.style("stroke", "red")
            })
            .on("mousemove", function (event) {
                tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function (event, d) {
                tooltip.style("opacity", 0)
                .text("");

                d3.select(event.currentTarget)
                .style("fill", d => {
                    if (d.populationdata === 0) {return "grey"} else {return color(d.populationdata)}});
            })
            .on("click", function (event, d, e = szAgeGrpData, f = amenityCountData, p = geopath) {
                clearTable();
                zoomToSubzone(d, p);
                highlightSubzone(event.currentTarget);
                sz_name = d.subzone_name;
                const szpopData = removeAttr(e.filter(e => e.Subzone === sz_name), "Subzone");
                total_szpop = szpopData[0].Total;
                const data = removeAttr(szpopData, "Total");
                // filter for amenity data
                const amenity_data = f.filter(f => f.SUBZONE_N === sz_name)
                if (parseInt(total_szpop) > 0) {
                    drawPieChart(data, sz_name);
                    // createTable(amenity_data);
                } else {
                    clearPieChart(`No population data for ${sz_name}`);
                }
                createTable(amenity_data);
            });

    svg.append("g")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    /* Legend */
    const legendWidth = 15;
    const legendHeight = 300;
    // const legendPadding = 10;

    const legend = svg.append("g")
    //.attr("transform", `translate(${width - 100}, 0)`);
    .attr("transform", `translate(${legendWidth + 10}, ${(height - legendHeight) / 2})`);

    legend
    .append("rect")
    .attr("x", -40)
    .attr("y", -60)
    .attr("width", legendWidth*9)
    .attr("height", legendHeight+80)
    .attr("fill", "rgb(184, 185, 188)")       // Background color
    // .attr("stroke", "#ccc")        // Optional border
    .attr("rx", 6)                 // Optional rounded corners
    .attr("ry", 6)
    .attr("opacity", "0.8")
    .lower(); // Ensures it's behind other legend elements

    // Create a gradient using population count data
    const defs = svg.append("defs");

    const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-vertical")
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");  // vertical gradient

    linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(d * maxPop));

    // Append rectangle using gradient
    legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient-vertical)");

    // Add scale axis
    const legendScale = d3.scaleLinear()
    .domain([0, maxPop])
    .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".0s"));

    legend.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

    // Label for legend
    legend.append("text")
    .attr("x", -18)
    .attr("y", -35)
    .attr("text-anchor", "start")
    .style("font-size", "18px")
    .style("font-family", "Cambria")
    .style("font-weight", "bold")
    .text("Legend:");

    legend.append("text")
    .attr("x", -10)
    .attr("y", -10)
    .attr("text-anchor", "start")
    .style("font-size", "12px")
    .style("font-family", "Cambria")
    .style("font-weight", "bold")
    .text("Population count");

    // Append North Arrow
    svg.append("image")
    .attr("href", "images/North arrow.png")  // replace with image path
    .attr("x", 900)
    .attr("y", 30)
    .attr("width", 40)
    .attr("height", 40);

    /// Amenities ///
    // List of CHAS clinics (array)
    clinicData.forEach(d => {

        attributes = domParser(d.properties.Description);
        d.clinic_name = attributes.HCI_NAME;
        d.longitude = d.geometry.coordinates[0]
        d.latitude = d.geometry.coordinates[1]
    })
    console.log(clinicData);

    const clinicsLayer = zoomLayer.append("g").attr("id", "clinicsLayer")

    clinicsLayer
    //.attr("id", "clinics")
    .selectAll("circle")
    .data(clinicData)
    .enter()
    .append("circle")
    .attr("cx", d => projection([d.longitude, d.latitude])[0])
    .attr("cy", d => projection([d.longitude, d.latitude])[1])
    .attr("r", 2)
    .attr("stroke", "black")
    .attr("fill", "rgb(131, 207, 255)");

    // List of CCs (array)
    ccData.forEach(d => {

        attributes = domParser(d.properties.Description);
        d.clinic_name = attributes.NAME;
        d.longitude = d.geometry.coordinates[0]
        d.latitude = d.geometry.coordinates[1]
    })
    console.log(ccData)

    const ccLayer = zoomLayer.append("g").attr("id", "ccLayer")

    ccLayer
    //.attr("id", "community")
    .selectAll("circle")
    .data(ccData)
    .enter()
    .append("circle")
    .attr("cx", d => projection([d.longitude, d.latitude])[0])
    .attr("cy", d => projection([d.longitude, d.latitude])[1])
    .attr("r", 2)
    .attr("stroke", "black")
    .attr("fill", "rgb(255, 230, 131)");

    // List of Eldercare centres
    eldercareData.forEach(d => {
        attributes - domParser(d.properties.Description);
        d.eldercare_name = attributes.NAME;
        d.longitude = d.geometry.coordinates[0]
        d.latitude = d.geometry.coordinates[1]
    })
    console.log(eldercareData);

    const eldercareLayer = zoomLayer.append("g").attr("id", "eldercareLayer")

    eldercareLayer
    //.attr("id", "community")
    .selectAll("circle")
    .data(eldercareData)
    .enter()
    .append("circle")
    .attr("cx", d => projection([d.longitude, d.latitude])[0])
    .attr("cy", d => projection([d.longitude, d.latitude])[1])
    .attr("r", 2)
    .attr("stroke", "black")
    .attr("fill", "rgb(197, 131, 255)");

    
    // Toggle visibility
    function toggleLayer(layer_id) {
        const layer = d3.select(`#${layer_id}`);
        const current = layer.style("display");
        layer.style("display", current === "none" ? "inline" : "none");
      }

      d3.select("#showCCs").on("change", function() {
        d3.select("#ccLayer").style("display", this.checked ? "inline" : "none");
      });
      
      d3.select("#showClinics").on("change", function() {
        d3.select("#clinicsLayer").style("display", this.checked ? "inline" : "none");
      });
      
      d3.select("#showEldercare").on("change", function() {
        d3.select("#eldercareLayer").style("display", this.checked ? "inline" : "none");
      });

})

// Collapsible elements
var collapse = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < collapse.length; i++) {
  collapse[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}