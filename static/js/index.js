function init() {
  if (window.goSamples) goSamples();
  var objGo = go.GraphObject.make;
  myDiagram = objGo(go.Diagram, "myDiagramDiv", {
    // 网格背景
    grid: objGo(
      go.Panel,
      "Grid",
      objGo(go.Shape, "LineH", {
        stroke: "lightgray",
        strokeWidth: 0.5
      }),
      objGo(go.Shape, "LineH", {
        stroke: "gray",
        strokeWidth: 0.5,
        interval: 10
      }),
      objGo(go.Shape, "LineV", {
        stroke: "lightgray",
        strokeWidth: 0.5
      }),
      objGo(go.Shape, "LineV", {
        stroke: "gray",
        strokeWidth: 0.5,
        interval: 10
      })
    ),
    allowDrop: true,
    "draggingTool.dragsLink": false,
    "draggingTool.isGridSnapEnabled": true, // 拖动时捕捉网格
    "linkingTool.isUnconnectedLinkValid": false, // 创建箭头线时必须连接两个端点
    "linkingTool.portGravity": 20, // 连线时附着端点的范围
    "relinkingTool.isUnconnectedLinkValid": true,
    "relinkingTool.portGravity": 20,
    // 重新调整连线时，可拖动点的样式
    "relinkingTool.fromHandleArchetype": objGo(go.Shape, "Diamond", {
      // 起始点
      segmentIndex: 0,
      cursor: "pointer",
      desiredSize: new go.Size(8, 8),
      fill: "lightblue",
      stroke: "#51c332"
    }),
    "relinkingTool.toHandleArchetype": objGo(go.Shape, "Diamond", {
      // 终点
      segmentIndex: -1,
      cursor: "pointer",
      desiredSize: new go.Size(8, 8),
      fill: "lightblue",
      stroke: "#51c332"
    }),
    "linkReshapingTool.handleArchetype": objGo(go.Shape, "Diamond", {
      // 拐点
      desiredSize: new go.Size(7, 7),
      fill: "lightblue",
      stroke: "#51c332"
    }),
    "undoManager.isEnabled": true
  });
  // 当图表发生改变时，save按钮转变成可点击状态，同时页面标题末尾添加*（表示已编辑未保存状态）
  myDiagram.addDiagramListener("Modified", function (e) {
    var button = document.getElementById("SaveButton");
    if (button) button.disabled = !myDiagram.isModified;
    var idx = document.title.indexOf("*");
    if (myDiagram.isModified) {
      if (idx < 0) document.title += "*";
    } else {
      if (idx >= 0) document.title = document.title.substr(0, idx);
    }
  });
  myDiagram.addModelChangedListener(function (evt) {
    if (!evt.isTransactionFinished) return;
    var txn = evt.object;
    if (txn === null) return;
    txn.changes.each(function (e) {
      if (e.modelChange !== "nodeDataArray") return;
      if (e.change === go.ChangedEvent.Insert) {
        // console.log(evt.propertyName + " added node with key: " + e.newValue.key);
        showDialog(e.No, 'add')
      } else if (e.change === go.ChangedEvent.Remove) {
        // console.log(evt.propertyName + " removed node with key: " + e.oldValue.key);
        
      }
    });

  })
  function makePort(name, spot, output, input) {
    return objGo(go.Shape, "Circle", {
      fill: null,
      stroke: null,
      desiredSize: new go.Size(7, 7),
      alignment: spot,
      alignmentFocus: spot,
      portId: name,
      fromSpot: spot,
      toSpot: spot,
      fromLinkable: output,
      toLinkable: input,
      cursor: "pointer"
    });
  }

  myDiagram.nodeTemplate = objGo(
    go.Node,
    "Spot",
    { locationSpot: go.Spot.Center },
    {
      doubleClick: function (e, node) {
        showDialog(node.hb, 'edit')
      },
      // contextClick: function() {
      //   alert('右键')
      // }
    },
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
      go.Point.stringify
    ),
    objGo(
      go.Panel,
      "Auto",
      { name: "PANEL" },
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(
        go.Size.stringify
      ),
      objGo(
        go.Shape,
        "RoundedRectangle",
        {
          portId: "",
          fromLinkable: true,
          toLinkable: true,
          cursor: "pointer",
          fill: "white",
          stroke: "#1a9dff",
          strokeWidth: 2
        },
        new go.Binding("figure"),
        new go.Binding("fill")
      ),
      objGo(
        go.Panel,
        "Vertical",
        {
          margin: 5
        },
        objGo(
          go.Picture,
          {
            width: 35,
            height: 35
          },
          new go.Binding("source", "type", function(t){ return 'static/img/' + t + '.gif'} )
        ),
        objGo(
          go.TextBlock,
          {
            font: "bold 8pt Helvetica, Arial, sans-serif",
            textAlign: "center",
            maxSize: new go.Size(65, NaN),
            minSize: new go.Size(65, NaN),
            wrap: go.TextBlock.WrapFit
            // editable: true
          },
          new go.Binding("text", "name").makeTwoWay()
        )
      )
    ),
    makePort("T", go.Spot.Top, true, true),
    makePort("L", go.Spot.Left, true, true),
    makePort("R", go.Spot.Right, true, true),
    makePort("B", go.Spot.Bottom, true, true),
    {
      mouseEnter: function (e, node) {
        showSmallPorts(node, true);
      },
      mouseLeave: function (e, node) {
        showSmallPorts(node, false);
      }
    }
  );

  function showSmallPorts(node, show) {
    node.ports.each(function (port) {
      if (port.portId !== "") {
        // don't change the default port, which is the big shape
        port.fill = show ? "rgba(0,0,0,.3)" : null;
      }
    });
  }

  var linkSelectionAdornmentTemplate = objGo(
    go.Adornment,
    "Link",
    objGo(go.Shape, {
      isPanelMain: true,
      fill: null,
      stroke: "#51c332",
      strokeWidth: 0
    })
  );

  myDiagram.linkTemplate = objGo(
    go.Link,
    {
      selectable: true,
      selectionAdornmentTemplate: linkSelectionAdornmentTemplate
    },
    { relinkableFrom: true, relinkableTo: true, reshapable: true },
    {
      routing: go.Link.AvoidsNodes,
      curve: go.Link.JumpOver,
      corner: 30,
      toShortLength: 4
    },
    new go.Binding("points").makeTwoWay(),
    objGo(go.Shape, {
      isPanelMain: true,
      strokeWidth: 2,
      stroke: "#1a9dff"
    }),
    objGo(go.Shape, { toArrow: "Standard", stroke: "#1a9dff" }),
    objGo(
      go.Panel,
      "Auto",
      objGo(
        go.Shape,
        "RoundedRectangle",
        { fill: "#F8F8F8", stroke: "#919191" },
        new go.Binding("visible", "isSelected").ofObject()
      ),
      objGo(
        go.TextBlock,
        {
          textAlign: "start",
          font: "bold 8pt helvetica, arial, sans-serif",
          stroke: "#000",
          editable: true
        },
        new go.Binding("text").makeTwoWay()
      )
    )
  );
  load();
  myPalette = objGo(go.Palette, "myPaletteDiv", {
    maxSelectionCount: 1,
    nodeTemplateMap: myDiagram.nodeTemplateMap,
    model: new go.GraphLinksModel([
      // 右侧选择框和弹窗类型都由此处type相关联
      { name: "NoOperation", type: 'No-operation' },
      { name: "Encoding", type: 'Character Encoding Translator' },
      { name: "Json2Xml", type: 'Json Transform To Xml' },
      { name: "Xml2Json", type: 'Xml Transform To Json' },
      { name: "Template", type: 'Template Coder' },
      { name: "Datebase", type: 'DataBase LookUp' },
      { name: "Http Client", type: 'Http Client' },
      { name: "Soap Client", type: 'Soap Client' }
    ])
  });
}

function save() {
  var isVerified = true
  myDiagram.nodes.each(function (node) {
    var temp = node.linksConnected.count > 0 
    isVerified = isVerified && temp
  });
  if (isVerified) {
    saveDiagramProperties();
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
    $.ligerDialog.success('提交成功')
  } else {
    $.ligerDialog.error('存在未连接的控件')
  }
}

function load() {
  myDiagram.model = go.Model.fromJson(
    document.getElementById("mySavedModel").value
  );
  loadDiagramProperties();
}

function saveDiagramProperties() {
  myDiagram.model.modelData.position = go.Point.stringify(myDiagram.position);
}

function loadDiagramProperties() {
  var pos = myDiagram.model.modelData.position;
  if (pos) myDiagram.initialPosition = go.Point.parse(pos);
}

function showDialog(templateData, openStyle) {
  var title, buttons, url, width, height

  if(openStyle === 'add') {
    title = "添加控件"+ templateData.name
    buttons = [
      {
        text: '取消',
        onclick: function (item, dialog) {
          myDiagram.commandHandler.deleteSelection()
          $.ligerDialog.close();
          $(".l-dialog,.l-window-mask").hide();
        }
      }
    ]
  } else {
    title = "编辑控件"+ templateData.name
    buttons = [
      {
        text: '删除',
        onclick: function (item, dialog) {
          myDiagram.commandHandler.deleteSelection()
          $.ligerDialog.close();
          $(".l-dialog,.l-window-mask").hide();
        }
      },
      {
        text: '取消',
        onclick: function (item, dialog) {
          $.ligerDialog.close();
          $(".l-dialog,.l-window-mask").hide();
        }
      }
    ]
  }
  switch (templateData.type) {
    case 'Character Encoding Translator':
      url = './dialog/addEncoding.html'
      width = 650
      height = 250
      break;
    case 'Template Coder':
      url = './dialog/addTemplate.html'
      width = 750      
      height = 500
      break;
    case 'DataBase LookUp' :
      url = './dialog/addDataBase.html'
      width = 650
      height = 450
      break;
    case 'Http Client' :
      url = './dialog/addHttpClient.html'
      width = 650
      height = 350
      break;
    case 'Soap Client' :
      url = './dialog/addSoapClient.html'
      width = 650
      height = 250
      break;
    default:
      url = './dialog/addDefault.html'
      width = 650
      height = 200
      break;
  }
  $.ligerDialog.open({
    title,
    url,
    width,
    height,
    data: templateData,
    saveNewTemplateData: function(newTemplateData) {
      flash(newTemplateData, templateData)
      $.ligerDialog.close();
      $(".l-dialog,.l-window-mask").hide();
    },
    buttons
  })
}

function flash(newTemplateData, oldTemplateData) {
  var model = myDiagram.model;
  //所有模型更改都应该在事务模型中进行
  model.startTransaction("flash");
  Object.keys(newTemplateData).forEach(function(key){
    model.setDataProperty(oldTemplateData, key, newTemplateData[key])
  })
  model.commitTransaction("flash");
}