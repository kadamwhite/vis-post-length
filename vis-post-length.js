/* global ARCHIVE_INFO:false */
'use strict';

var d3 = require( 'd3' );
var WP = require( 'wordpress-rest-api' );

// Discover API endpoint (http://v2.wp-api.org/guide/discovery/)
var links = document.getElementsByTagName( 'link' );
var apiLink = Array.prototype.filter.call( links, function( item ) {
  return item.rel.indexOf( 'api.w.org' ) > -1;
});
var apiRoot = apiLink[ 0 ] && apiLink[ 0 ].href;

// Bind WP endpoint: use the .site convenience method
var site = new WP({
  endpoint: apiRoot
});

// Injected via wp_localize_script
var page = ARCHIVE_INFO.page;

// Use the WP API client plugin _purely_ to generate a URL
var archiveQuery = site.posts().page( page )._renderURI();

d3.json( archiveQuery, function( posts ) {
  // The SVG will get a max-width so these just establish the proportions
  var width = 1000;
  var height = 200;

  // Select the container we rendered onto the page
  var container = d3.select( '#vis-container' );

  var tooltip = container.append( 'p' )
    .attr({
      class: 'tooltip',
      style: 'text-align: right;margin-bottom: 0;'
    })
    .html( '&nbsp;' );
  var svg = container
    // .attr( 'style', 'padding: 20px;' )
    .append( 'svg' )
      .attr({
        // Set viewbox to permit max width-based CSS styling
        viewBox: '0 0 ' + width + ' ' + height,
        width: width,
        height: height,
        preserveAspectRatio: 'xMidYMid',
        style: 'max-width: 100%;'
      });

  function getPostLength( post ) {
    return post.content.rendered
      // Strip HTML tags
      .replace( /<[^>]+>/g, '' )
      .split( /[\s\n]/ )
      .length;
  }

  function getPostId( post ) {
    return post.id;
  }

  function readingTime( wordCount ) {
    // 228 via https://en.wikipedia.org/wiki/Words_per_minute#Reading_and_comprehension
    var wpm = wordCount / 228;
    return ( wpm > 1 ? Math.floor( wpm ) : 1 ) + ' Minute Read';
  }

  var yScale = d3.scale.linear()
    .domain([ 0, d3.max( posts.map( getPostLength ) ) ])
    .range([ height, 30 ]);
  var xScale = d3.scale.ordinal()
    .domain( posts.map( getPostId ) )
    .rangeBands([ 0, width ], 0.2 );

  // Render the actual bar chart
  svg.selectAll( 'rect.bar' ).data( posts, getPostId )
    .enter()
      .append( 'rect' )
      .attr({
        class: 'bar',
        x: function( d, i ) {
          return xScale( d.id );
        },
        y: function( d ) {
          return yScale( getPostLength( d ) );
        },
        width: xScale.rangeBand(),
        height: function( d ) {
          return height - yScale( getPostLength( d ) );
        },
        fill: '#a6a6a6'
      });

  // Make invisible, full-height tooltip rectangles on top of the bar chart
  svg.selectAll( 'rect.tooltip-trigger' ).data( posts, getPostId )
    .enter()
      .append( 'rect' )
      .attr({
        class: 'tooltip-trigger',
        style: 'cursor: pointer;',
        x: function( d, i ) { return xScale( d.id ); },
        y: 0,
        width: xScale.rangeBand(),
        height: height,
        stroke: 0,
        fill: 'rgba( 255, 255, 255, 0 )'
      })
      .on( 'mouseenter', function( d ) {
        tooltip.html( d.title.rendered + ': ' + readingTime( getPostLength( d ) ) );
      })
      .on( 'mouseleave', function( d ) {
        tooltip.html( '&nbsp;' );
      })
      .on( 'click', function( d ) {
        window.location = d.link;
      });
});

d3.select
