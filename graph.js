var svg = d3.select("#typeChart > #graph").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

var immune = svg.append("g").selectAll(".immune"),
    weak = svg.append("g").selectAll(".weak"),
    strong = svg.append("g").selectAll(".strong"),
    eventPanel = svg.append('g').selectAll(".event-link"),
    node = svg.append("g").selectAll(".node"),
    personLink = svg.append('g').selectAll('person-link'),
    personPanel = svg.append("g").selectAll('.person-node');

function project(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
function addNumProp(data) {
    var user  = data.user,
        event = data.event;
    user.forEach(function(item) {
        item.events.forEach(function(i) {
            event.map(function(item) {
                if (item.name === i) {
                    if (!item.num) {
                        item.num = 1;
                    } else {
                        item.num++;
                    }
                }
            });
        });
    });

};
d3.json("data.json", function(error, classes) {
    addNumProp(classes);
    var nodes = cluster(d3.hierarchy(packageHierarchy(classes.event))).children;
    var immunes = typeImmune(nodes);
    var strengths = typeStrong(nodes);
    var weaknesses = typeWeak(nodes);
    var stratify = d3.stratify()
        .parentId(function(d) {return d.parentId; });
    var tree = d3.cluster()
        .size([360, 180]);
    var personNodes = tree(stratify(classes.user)).descendants();
    var events = typeEvent(nodes, personNodes);


    var color = d3.scaleLinear().domain([1, 10]).range(['#009cdc', '#000141']);
    var width = 700,
    height = 700;
    var gBundle = svg.append("g")
          // .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
    var link = personLink 
    .data(personNodes.slice(1))
    .enter().append("path")
    .attr("class", "person-link")
    .attr("d", function(d) {
    return "M" + project(d.x, d.y)
        + "C" + project(d.x, (d.y + d.parent.y) / 2)
        + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
        + " " + project(d.parent.x, d.parent.y);
    });


    var personNode = personPanel
        .data(personNodes)
          .enter()
          .append("g")
          .attr("class", "person-node")
          .attr("transform", function(d) {
                return "rotate(" + (d.x- 90) + ")translate(" + d.y + ")" + "rotate("+ (90 - d.x) +")"; 
          })
        .on('click', function(d) {
            window.eventTT
            .classed("is-immune", function(l) {
                if (l.source === d) {
                    return l.source.target = true;
                }
            })
            .filter(function(l) {
                return l.source === d;
            })
            .each(function(d) {
                 this.parentNode.appendChild(this);
            });
        });
        
    personNode.append("circle")
          .attr("r", function(d, i) { return 20 + (d.data.density || 0) * 5 })
          .style("fill", '#89db47' )
          .style('stroke-width', '1px')
          .style('stroke-opacity', '0.3');
        
    personNode.append("text")
        .attr("dy",".2em")
        .attr('fill', "white")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.name; });
    window.node = node
        .data(nodes.filter(function(n) {
            return !n.children;
        }))
        .enter()
        .append("g")
        .attr('class', 'event-node')
        .attr("transform", function(d) {
            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")" + (d.x < 180 ? "" : "rotate(180)");
        })
        .on('click', function(d) {
            window.eventTT
            .classed("is-immune", function(l) {
                if (l.target === d) {
                    return l.source.target = true;
                }
            })
            .filter(function(l) {
                return l.target === d;
            })
            .each(function(d) {
                 this.parentNode.appendChild(this);
            });
        });

        node.append('circle')
        .attr("r", function(d, i) { return 20 + (d.data.num || 1) *5 })
      .style("fill",function(d,i){ return color(d.data.density || 1); })
          .style('stroke-width', '1px')
          .style('stroke-opacity', '0.3')

        node.append("text")
        .attr("class", function(n) {
            return 'event-node node ' + n.data.name.toLowerCase();
        })
        .attr('fill', "white")
        .attr("dx", function(d) {
            return d.x < 180 ? -10 : 10;
        })
        .attr("dy", ".31em")
        .style("text-anchor", function(d) {
            return d.x < 180 ? "start" : "end";
        })
        .text(function(d) {
            return d.data.key;
        })
        //.on("click", activate);

    window.eventTT = eventPanel
    .data(events)
    .enter().append("path")
    .attr("class", "event-link")
    .attr("d", function(d) {
    return "M" + project(d.source.x, d.source.y)
        + "C" + project(d.source.x, (d.source.y + d.target.y) / 2)
        + " " + project(d.target.x, (d.source.y + d.target.y) / 2)
        + " " + project(d.target.x, d.target.y);
    });
        /*
    window.eventTT = eventPanel 
        .data(events.map(function(node){
            return node.source.path(node.target);
        }))
        .enter().append("path")
        .each(function(d) {
            d = d.filter(function(item) {
                return item;
            });
            console.log(d);
            d.source = d[0], d.target = d[d.length - 1];
        })
        .attr("class", "immune")
        .attr("d", line);
        */

    window.weak = weak
        .data(weaknesses.map(function(node){
            return node.source.path(node.target);
        }))
        .enter().append("path")
        .each(function(d) {
            d.source = d[0], d.target = d[d.length - 1];
        })
        .attr("class", "weak")
        .attr("d", line);

    window.strong = strong
        .data(strengths.map(function(node){
            return node.source.path(node.target);
        }))
        .enter().append("path")
        .each(function(d) {
            d.source = d[0], d.target = d[d.length - 1];
        })
        .attr("class", "strong")
        .attr("d", line)
        .attr("data-is-effective-against-self", function(d) {
            return (d[0] === d[d.length - 1]);
        });
});


function activate(d) {


    if (window.dualType.size() > 2) {
        window.dualType = {
            size: function() {
                var size = 0,
                    key;
                for (key in this) {
                    if (this.hasOwnProperty(key)) size++;
                }
                return size;
            }
        };
        window.dualTypeIdx = [];
        window.node.each(function(n) {
            n.target = n.source = false;
        }).attr("class", function(n) {
            return 'node ' + n.data.name.toLowerCase();
        });
    }

    if (window.dualType[d.data.name] !== undefined) {
        delete window.dualType[d.data.name];
    }

    window.dualType[d.data.name] = d;
    window.dualTypeIdx.push(d);

   
    window.node
        .each(function(n) {
            n.target = n.source = false;
        });



    window.immune
        .classed("is-immune", function(l) {
            return window.colorPath(window.dualType, l, 'weak');
        })
        .filter(function(l) {
            return l.target === d;
        })
        .each(function(d) {
            this.parentNode.appendChild(this);
        });

    window.weak
        .classed("resists-against", function(l) {
            return window.colorPath(window.dualType, l, 'weak');
        })
        .filter(function(l) {
            return l.target === d;
        })
        .each(function() {
            this.parentNode.appendChild(this);
        });

    window.strong
        .classed("is-weak-against", function(l) {
            return window.colorPath(window.dualType, l, 'weak');
        })
        .filter(function(l) {
            return l.target === d;
        })
        .each(function() {
            this.parentNode.appendChild(this);
        });


    window.node
        .classed("node--active", function(target) {
            return (target === d) || this.classList.contains("node--active");
        })
        .classed("node--target", function(n) {
            return n.target;
        })
        .classed("immune-node", function(target, l) {
            return (this.classList.contains('immune-node') || target.data.immunes.indexOf(d.data.name) != -1);
        })
        .classed("weaknesses-node", function(target) {
            return (this.classList.contains('weaknesses-node') || target.data.weaknesses.indexOf(d.data.name) != -1);
        })
        .classed("strengths-node", function(target) {
            return (target.data.strengths.indexOf(d.data.name) != -1);
        })
        .classed("double-strengths-node", function(target) {
            return ( !! window.dualTypeIdx[0] && !! window.dualTypeIdx[1] && target.data.strengths.indexOf(window.dualTypeIdx[0].name) !== -1 && target.strengths.indexOf(window.dualTypeIdx[1].name) !== -1);
        })
        .classed("double-weaknesses-node", function(target) {
            return ( !! window.dualTypeIdx[0] && !! window.dualTypeIdx[1] && target.data.weaknesses.indexOf(window.dualTypeIdx[0].name) !== -1 && target.weaknesses.indexOf(window.dualTypeIdx[1].name) !== -1);
        });
}

d3.select(self.frameElement).style("height", diameter + "px");

// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
    var map = {};

    function find(name, data) {
        var node = map[name],
            i;
        if (!node) {
            node = map[name] = data || {
                name: name,
                children: []
            };
            if (name.length) {
                node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                node.parent.children.push(node);
                node.key = name.substring(i + 1);
            }
        }
        return node;
    }
    classes.forEach(function(d) {
        find(d.name, d);
    });

    return map[""];
}

//Make the immune links
function typeImmune(nodes) {
    var map = {},
        immunes = [];

    nodes.forEach(function(d) {
        map[d.data.name] = d;
    });

    nodes.forEach(function(d) {
        if (d.data.immunes) d.data.immunes.forEach(function(i) {
            immunes.push({
                source: map[d.data.name],
                target: map[i]
            });
        });
    });

    return immunes;
}
function typeEvent(nodes, personNodes) {
    var map = {},
        immunes = [];

    nodes.forEach(function(d) {
        map[d.data.name] = d;
    });
    personNodes.forEach(function(d) {
        map[d.data.name] = d;
    });

    personNodes.forEach(function(d) {
        if (d.data.events) d.data.events.forEach(function(i) {
            immunes.push({
                source: map[d.data.name],
                target: map[i]
            });
        });
    });

    return immunes;
}
//Make the immune links
function typeWeak(nodes) {
    var map = {},
        weaknesses = [];

    nodes.forEach(function(d) {
        map[d.data.name] = d;
    });

    nodes.forEach(function(d) {
        if (d.data.weaknesses) d.data.weaknesses.forEach(function(i) {
            weaknesses.push({
                source: map[d.data.name],
                target: map[i]
            });
        });
    });

    return weaknesses;
}

function typeStrong(nodes) {
    var map = {},
        strengths = [];

    nodes.forEach(function(d) {
        map[d.data.name] = d;
    });

    nodes.forEach(function(d) {
        if (d.data.strengths) d.data.strengths.forEach(function(i) {
            strengths.push({
                source: map[d.data.name],
                target: map[i]
            });
        });
    });

    return strengths;
}
