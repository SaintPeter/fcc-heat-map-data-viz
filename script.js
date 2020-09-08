
// Data URL
//url = 'global-temperature.json'
url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"

// Fetch Data
fetch(url)
  .then(response => {
    response.json().then(data => {
        processData(data);
      }
    );
    
  })
  .catch(err => {
    console.warn("Fetch Failed: ",err)
  })

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];


// SVG Auto Resize
// Taken from: https://benclinkinbeard.com/d3tips/make-any-chart-responsive-with-one-function/
function responsivefy(svg) {
  const container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style('width'), 10),
    height = parseInt(svg.style('height'), 10),
    aspect = width / height;

  svg.attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMid')
    .call(resize);

  d3.select(window).on(
    'resize.' + container.attr('id'),
    resize
  );

  function resize() {
    const w = parseInt(container.style('width'));
    svg.attr('width', w);
    svg.attr('height', Math.round(w / aspect));
  }
}

function processData(dataset) {
  let data = dataset.monthlyVariance.map(d => {
    return Object.assign(d, {
      temp: dataset.baseTemperature + d.variance
    })
  });

  let margin = {
    left: 100,
    right: 50,
    top: 100,
    bottom: 150
  }

  let w = parseInt(d3.select('svg').style('width')) - margin.left - margin.right;
  let h = parseInt(d3.select('svg').style('height')) - margin.top - margin.bottom;

  let barHeight = h / 12;
  let barWidth = 7;

  let yearStart = d3.min(data, d => d.year);
  let yearEnd = d3.max(data, d => d.year );
  let yearDelta = yearEnd - yearStart;

  let tooltip = d3.select(".container")
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")

  // Init SVG
  let svg = d3.select('body')
    .select('svg')
    .attr("width", w + margin.left + margin.right)
    .attr("height",  h + margin.top + margin.bottom)
    .call(responsivefy)
    //.attr('viewBox', `0 0 ${w + margin.left + margin.right} ${h + margin.top + margin.bottom}`);

  // Append div to provide scrolling
  let foreign = svg.append("foreignObject")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", w)
    .attr("height",  h + 40)
    .append("xhtml:div")
    .style("max-height", h )
    .style("max-width", w )
    .style("overflow-x", "scroll");

  let innerSVG = foreign.append('svg')
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", yearDelta * barWidth)
    .attr("height",  h + 20)

  // X Scale and Axis
   let xScale = d3.scaleLinear()
    .domain([ yearStart,yearEnd ])
    .range([ 0 , barWidth * yearDelta ])

  let xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format("d"));

  // X-Axis
  innerSVG.append("g")
    .attr('id', 'x-axis')
    .style('font-size', '14px')
    .attr("transform", `translate(0, ${ h })`)
    .call(xAxis)
  
  // Y Scales and Axis
  let yScale = d3.scaleBand()
    .domain(monthNames)
    .rangeRound([0, h])

  let yAxis = d3.axisLeft(yScale);

  // Y-Axis
  svg.append("g")
    .attr('id', 'y-axis')
    .attr("transform", `translate(${ margin.left },${ margin.top })`)
    .style('font-size', '14px')
    .call(yAxis)

  // Color Scale
  let tempRange = [
    d3.min(data, d => d.temp),
    d3.max(data, d => d.temp)
  ];


  let colors = [
    { offset: "0%", color: d3.color('blue') },
    { offset: "25%", color: d3.color('lightblue')},
    { offset: "50%", color: d3.color('lightyellow')},
    { offset: "75%", color: d3.color('orange')},
    { offset: "100%", color: d3.color('darkred')},
  ]

  let colorScale = d3.scaleLinear()
    .domain(colors.map(i => {
        return tempRange[0] + (parseFloat(i.offset) / 100) * tempRange[1];
      }))
    .range(colors.map(c => c.color))

  // Primary Data Display
  innerSVG.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.year))
    .attr('y', d => (d.month - 1) * barHeight)
    .attr('fill', d => colorScale(d.temp))
    .attr('width', barWidth)
    .attr('height', barHeight - 1)
    .attr('class', 'cell' )
    .attr('data-month', d => d.month - 1)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => d.temp)
    .on('mouseover', function (e, d) {
        let ttText =
          `<strong>${d.year}-${monthNames[d.month - 1]}</strong>` +
          `<br>${d.temp.toFixed(1)}&deg;C` +
          `<br>${d.variance.toFixed(1)}&deg;C`;

        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9)
        tooltip
          .html(ttText)
          .style("left", e.clientX + 10 + "px")
          .style("top", e.clientY - 10 + "px")
          .attr('data-year', d.year )
      })
      .on('mouseout', function () {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      })
  
  // Chart Title
  svg.append('text')
    .text("Monthly Global Land-Surface Temperature")
    .attr('class','title')
    .attr('x', w/2 + margin.left)
    .attr('y', margin.top / 2)
    .attr('id', 'title')

  // Chart Subtitle
  svg.append('text')
    .html(`${yearStart} - ${yearEnd}: base temperature ${dataset.baseTemperature}&deg;C`)
    .attr('class', 'subtitle')
    .attr('x', w/2 + 20)
    .attr('y', margin.top - 20)
    .attr('id', 'description')

  // Legend
  // Legend group
  let legend = svg.append('g')
    .attr('class', 'legend')
    .attr('id', 'legend')

  // Add Color Boxes to legend
  let rectWidth = w / 2 / colors.length
  let rectHeight = 40
  legend.selectAll('rect')
    .data(colors)
    .enter()
    .append('rect')
    .attr('x', (d, i) => i * rectWidth)
    .attr('y', 0)
    .attr('width', rectWidth)
    .attr('height', rectHeight)
    .style('fill', d => d.color)
    .style('stroke-width', 1)
    .style('stroke', 'black')

  let legendX =  margin.left + legend.node().getBBox().width / 2
  let legendY = ((h - legend.node().getBBox().height)) + margin.top + margin.bottom * 2/3
  legend.attr('transform', `translate(${ legendX },${ legendY })`)

  let legendScale = d3.scaleLinear()
    .domain(tempRange)
    .range([0, colors.length * rectWidth])

  let legendAxis = d3.axisBottom().scale(legendScale);

  legend.append("g")
    .attr('id', 'legend-axis')
    .attr("transform", `translate(0, ${rectHeight})`)
    .style('font-size', '14px')
    .call(legendAxis)
}


