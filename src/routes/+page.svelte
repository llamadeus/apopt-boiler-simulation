<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { Line, Object3D } from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { getAppliances, getConnections, getNodes } from '../data';
  import type { Connection, Node } from '../types';
  import {
    cleanConnections, computeLitresPerHourFromConsumption, computeLoss,
    computeVolume,
    connectionKey,
    getConnectionsFromPath,
    isApplianceNode,
  } from '../utils/misc';
  import { aStar, createGraph, findUnreachableNodes } from '../utils/pathfinding';
  import { createLine, createNode, createPlane, createSphere } from '../utils/three';


  interface NodeInfo {
    node: Node;
  }

  interface ConnectionInfo {
    connection: Connection;
    line: Line;
    start: Node;
    end: Node;
  }

  onMount(() => {
    const BOILER = 'boiler';

    THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

    const appliances = getAppliances();
    let nodes = getNodes();
    let connections = getConnections();

    const nodesMap = new Map<string, Node>(nodes.map(node => [node.pipeId, node]));
    const width = window.innerWidth;
    const height = window.innerHeight;
    const graph = createGraph(nodes, connections);

    console.log(`VOLUME BEFORE CLEANUP: ${computeVolume(connections, nodes)}`);

    const unreachable = findUnreachableNodes(graph, BOILER);
    // Remove unreachable nodes
    for (const node of unreachable) {
      const nodeIndex = nodes.findIndex(n => n.pipeId === node.id);

      graph.nodes.delete(node.id);
      nodes.splice(nodeIndex, 1);
    }

    // Remove connections where the nodes are missing
    connections = cleanConnections(connections, nodes);
    console.log(`VOLUME AFTER UNCONNECTED CLEANUP: ${computeVolume(connections, nodes)}`);

    const identified = new Set<string>();
    for (let current of nodes) {
      while (true) {
        if (isApplianceNode(current)) {
          break;
        }

        const [connection, ...other] = connections.filter(c => c.nodeA === current.pipeId || c.nodeB === current.pipeId);

        if (other.length > 0) {
          break;
        }

        // Delete node
        identified.add(current.pipeId);

        if (typeof connection != 'undefined') {
          const connectionIndex = connections.indexOf(connection);
          const otherId = connection.nodeA === current.pipeId
            ? connection.nodeB
            : connection.nodeA;
          const other = nodes.find(n => n.pipeId === otherId);

          if (typeof other == 'undefined') {
            throw new Error('Cannot find other node');
          }

          current = other;
          connections.splice(connectionIndex, 1);
        }
        else {
          break;
        }
      }
    }

    nodes = nodes.filter(node => ! identified.has(node.pipeId));
    console.log(`VOLUME AFTER DEAD END CLEANUP: ${computeVolume(connections, nodes)}`);

    // SANITY CHECK & Reduction code
    const usedPipes = new Set<string>();
    for (const appliance of getAppliances()) {
      const nodeId = ['shop', 'shared'].includes(appliance.household)
        ? appliance.name
        : `${appliance.name}_${appliance.household[0].toLowerCase()}`;
      const path = aStar(graph, nodeId, BOILER);

      if (path === null) {
        throw new Error(`Cannot find path for appliance ${appliance.name}@${appliance.household}`);
      }

      // Compute cost
      const connections = getConnectionsFromPath(path);
      const loss = computeLoss(connections, nodes);
      const consumptionInLitresPerHour = computeLitresPerHourFromConsumption(appliance.energyConsumptionInKJPerHour);
      const lossInLitresPerHour = computeLitresPerHourFromConsumption(loss);
      const consumptionForCentralBoiler = 160 * (consumptionInLitresPerHour + lossInLitresPerHour);
      const consumptionForLocalBoiler = 640 * consumptionInLitresPerHour;

      console.log(JSON.stringify({
        appliance: nodeId,
        'consumption (central boiler)': consumptionForCentralBoiler,
        'consumption (local boiler)': consumptionForLocalBoiler,
        decision: consumptionForCentralBoiler < consumptionForLocalBoiler ? 'CENTRAL BOILER' : 'LOCAL BOILER',
      }, undefined, 2));

      for (const connection of connections) {
        usedPipes.add(connectionKey(connection));
      }
    }

    const usedConnections = connections.filter(connection => usedPipes.has(connectionKey(
      connection.nodeA,
      connection.nodeB,
    )));
    console.log(`VOLUME AFTER INEFFICIENCY CLEANUP: ${computeVolume(usedConnections, nodes)}`);

    // init
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const controls = new OrbitControls(camera, renderer.domElement);
    const material = new THREE.LineBasicMaterial({ color: 0xff8800 });
    const materialUnused = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    const materialHover = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const matGold = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const matStart = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const matEnd = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const nodeInfos = new Map<Object3D, NodeInfo>();
    const lines = new Map<string, ConnectionInfo>();

    const com = { x: 0, y: 0, z: 0 };
    for (const node of nodes) {
      com.x += node.x / nodes.length;
      com.y += node.y / nodes.length;
      com.z += node.z / nodes.length;
    }

    createPlane('basement.png', -3 - com.z).then(mesh => scene.add(mesh));
    createPlane('shop.png', 0 - com.z).then(mesh => scene.add(mesh));
    createPlane('flat.png', 3 - com.z).then(mesh => scene.add(mesh));
    createPlane('flat.png', 6 - com.z).then(mesh => scene.add(mesh));
    createPlane('flat.png', 9 - com.z).then(mesh => scene.add(mesh));

    for (const connection of connections) {
      const start = { ...nodesMap.get(connection.nodeB)! };
      const end = { ...nodesMap.get(connection.nodeA)! };

      start.x -= com.x;
      start.y -= com.y;
      start.z -= com.z;
      end.x -= com.x;
      end.y -= com.y;
      end.z -= com.z;

      const lineMaterial = usedPipes.has(connectionKey(start.pipeId, end.pipeId))
        ? material
        : materialUnused;
      const line = createLine(start, end, lineMaterial);
      const startObj = start.pipeId === BOILER
        ? createSphere(start, matGold)
        : createNode(start, matStart);
      const endObj = end.pipeId === BOILER
        ? createSphere(end, matGold)
        : createNode(end, matEnd, { special: true });

      lines.set(connectionKey(start, end), { connection, line, start, end });
      nodeInfos.set(startObj, { node: start });
      nodeInfos.set(endObj, { node: end });

      scene.add(
        line,
        startObj,
        endObj,
      );
    }

    let hovered: Object3D | null = null;

    camera.position.x = 0;
    camera.position.y = -17;
    camera.position.z = 13;
    scene.background = new THREE.Color(200, 200, 200);
    renderer.setSize(width, height);
    renderer.setAnimationLoop(() => {
      controls.update();

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster
        .intersectObjects(scene.children, true)
        .filter(intersection => intersection.object.name.startsWith('node'));
      if (intersects.length > 0) {
        const first = intersects[0].object;

        if (first !== hovered) {
          if (hovered !== null) {
            hovered.scale.set(1, 1, 1);
          }

          hovered = first;
          hovered.scale.set(2, 2, 2);
        }

        document.body.style.cursor = 'pointer';
      }
      else {
        if (hovered !== null) {
          hovered.scale.set(1, 1, 1);
          hovered = null;
        }

        document.body.style.cursor = '';
      }

      renderer.render(scene, camera);
    });

    document.getElementById('root')?.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onClick);
    window.addEventListener('pointermove', onPointerMove);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const activeLines: Line[] = [];

    function onClick() {
      activeLines.forEach((line) => {
        line.material = material;
      });

      if (hovered) {
        const info = nodeInfos.get(hovered)!;
        const path = aStar(graph, info.node.pipeId, BOILER);

        if (path === null) {
          console.error('Cannot find path to boiler');
          return;
        }

        const appliance = appliances.find(appliance => (
          appliance.name == info.node.pipeId
          || `${appliance.name}_${appliance.household[0].toLowerCase()}` === info.node.pipeId
        ));

        if (! appliance) {
          console.error('Not an appliance');
          return
        }

        const connections = getConnectionsFromPath(path);
        const loss = computeLoss(connections, nodes);
        const consumptionInLitresPerHour = computeLitresPerHourFromConsumption(appliance.energyConsumptionInKJPerHour);
        const lossInLitresPerHour = computeLitresPerHourFromConsumption(loss);
        const consumptionForCentralBoiler = 160 * (consumptionInLitresPerHour + lossInLitresPerHour);
        const consumptionForLocalBoiler = 640 * consumptionInLitresPerHour;

        for (const connection of connections) {
          const key = connectionKey(connection);
          const info = lines.get(key)!;

          info.line.material = materialHover;
          activeLines.push(info.line);
        }

        console.log(JSON.stringify({
          appliance: info.node.pipeId,
          applianceConsumption: appliance.energyConsumptionInKJPerHour,
          loss: loss,
          central: consumptionForCentralBoiler,
          local: consumptionForLocalBoiler,
        }, undefined, 2));
      }
    }

    function onPointerMove(event: MouseEvent) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('click', onClick);
      window.removeEventListener('pointermove', onPointerMove);
    };
  });
</script>


<style>
  :global(html),
  :global(body) {
    margin: 0;
  }
</style>
