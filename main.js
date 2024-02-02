import 'style.css'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl.css'
import style from 'style.json'
import * as pmtiles from 'pmtiles'
import * as BABYLON from 'babylonjs'
import 'babylonjs.loaders.js'

let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles",protocol.tile);

const BABYLON = window.BABYLON;

const map = (window.map = new maplibregl.Map({
    container: 'map',
    style: style,
    zoom: 15,
    center: [37.633640, 55.828649],
    pitch: 45,
    bearing: 23,
    antialias: true
    }));

const worldOrigin = [37.633640, 55.828649];
const worldAltitude = 0;

const worldRotate = [Math.PI / 2, 0, 0 ];

const worldOriginMercator = maplibregl.MercatorCoordinate.fromLngLat(
    worldOrigin,
    worldAltitude
);
const worldScale = worldOriginMercator.meterInMercatorCoordinateUnits();

const worldMatrix = BABYLON.Matrix.Compose(
    new BABYLON.Vector3(worldScale, worldScale, worldScale),
    BABYLON.Quaternion.FromEulerAngles(
        worldRotate[0],
        worldRotate[1],
        worldRotate[2],
    ),
    new BABYLON.Vector3(
        worldOriginMercator.x,
        worldOriginMercator.y,
        worldOriginMercator.z
    )
);

const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd (map, gl) {
        this.engine = new BABYLON.Engine(
            gl,
            true,
            {
                useHighPrecisionMatrix: true
            },
            true
        );
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.autoClear = false;
        this.scene.detachControl();

        this.scene.beforeRender = () => {
            this.engine.wipeCaches(true);
        };

        this.camera = new BABYLON.Camera(
            'Camera',
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );

        const light = new BABYLON.HemisphericLight(
            'light1',
            new BABYLON.Vector3(0, 0, 100),
            this.scene
        );
        light.intensity = 0.7;

        BABYLON.SceneLoader.LoadAssetContainerAsync(
            'central.glb',
            '',
            this.scene
        ).then((modelContainer) => {
            modelContainer.addAllToScene();

            const rootMesh = modelContainer.createRootMesh();
        });

        this.map = map;
    },
    render (gl, matrix) {
        const cameraMatrix = BABYLON.Matrix.FromArray(matrix);

        const wvpMatrix = worldMatrix.multiply(cameraMatrix);

        this.camera.freezeProjectionMatrix(wvpMatrix);

        this.scene.render(false);
        this.map.triggerRepaint();
    }
};

map.on('style.load', () => {
    map.addLayer(customLayer);
});