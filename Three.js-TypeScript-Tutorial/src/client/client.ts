import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene()
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const light = new THREE.DirectionalLight(0xffffff, 10)
light.position.set(-4.4, 3.3, 2.2)
light.castShadow = true
light.shadow.bias = -0.003
light.shadow.mapSize.width = 2048
light.shadow.mapSize.height = 2048
light.shadow.camera.left = -5
light.shadow.camera.right = 5
light.shadow.camera.top = 2
light.shadow.camera.bottom = -2
light.shadow.camera.near = 1
light.shadow.camera.far = 10

scene.add(light)

//const helper = new THREE.DirectionalLightHelper(light);
const helper = new THREE.CameraHelper(light.shadow.camera)
scene.add(helper)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 1, 1)

const renderer = new THREE.WebGLRenderer()
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
//renderer.physicallyCorrectLights = true //deprecated
renderer.useLegacyLights = false //use this instead of setting physicallyCorrectLights=true property
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const planeGeometry = new THREE.PlaneGeometry(3.6, 1.8, 360, 180)

const material = new THREE.MeshStandardMaterial()
material.metalness = 0
material.roughness = 0

const texture = new THREE.TextureLoader().load('img/worldColour.5400x2700.jpg')
material.map = texture

const displacementMap = new THREE.TextureLoader().load(
    'img/gebco_bathy.5400x2700_8bit.jpg'
)
material.displacementMap = displacementMap
material.displacementScale = 0.3

const plane = new THREE.Mesh(planeGeometry, material)
plane.rotation.x = -Math.PI / 2
plane.castShadow = true
plane.receiveShadow = true

scene.add(plane)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
const stats = new Stats()
document.body.appendChild(stats.dom)
var options = {
    side: {
        FrontSide: THREE.FrontSide,
        BackSide: THREE.BackSide,
        DoubleSide: THREE.DoubleSide,
    },
}
const gui = new GUI()
const materialFolder = gui.addFolder('THREE.Material')
materialFolder
    .add(material, 'transparent')
    .onChange(() => (material.needsUpdate = true))
materialFolder.add(material, 'opacity', 0, 1, 0.01)
materialFolder.add(material, 'depthTest')
materialFolder.add(material, 'depthWrite')
materialFolder
    .add(material, 'alphaTest', 0, 1, 0.01)
    .onChange(() => updateMaterial())
materialFolder.add(material, 'visible')
materialFolder
    .add(material, 'side', options.side)
    .onChange(() => updateMaterial())
//materialFolder.open()
const data = {
    color: material.color.getHex(),
    shadowMapSizeWidth: 2048,
    shadowMapSizeHeight: 2048,
}

const meshStandardMaterialFolder = gui.addFolder('THREE.MeshStandardMaterial')

meshStandardMaterialFolder.addColor(data, 'color').onChange(() => {
    material.color.setHex(Number(data.color.toString().replace('#', '0x')))
})
meshStandardMaterialFolder.add(material, 'wireframe')
meshStandardMaterialFolder
    .add(material, 'flatShading')
    .onChange(() => updateMaterial())
meshStandardMaterialFolder.add(material, 'displacementScale', -1, 1, 0.01)
meshStandardMaterialFolder.add(material, 'displacementBias', -1, 1, 0.01)

meshStandardMaterialFolder.add(material, 'roughness', 0, 1)
meshStandardMaterialFolder.add(material, 'metalness', 0, 1)
//meshStandardMaterialFolder.open()

var planeData = {
    width: 3.6,
    height: 1.8,
    widthSegments: 180,
    heightSegments: 90,
}
const planePropertiesFolder = gui.addFolder('PlaneGeometry')
//planePropertiesFolder.add(planeData, 'width', 1, 30).onChange(regeneratePlaneGeometry)
//planePropertiesFolder.add(planeData, 'height', 1, 30).onChange(regeneratePlaneGeometry)
planePropertiesFolder
    .add(planeData, 'widthSegments', 1, 360)
    .onChange(regeneratePlaneGeometry)
planePropertiesFolder
    .add(planeData, 'heightSegments', 1, 180)
    .onChange(regeneratePlaneGeometry)
//planePropertiesFolder.open()

const directionalLightFolder = gui.addFolder('THREE.DirectionalLight')
directionalLightFolder
    .add(light.shadow.camera, 'left', -5, -1, 0.1)
    .onChange(() => light.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(light.shadow.camera, 'right', 1, 5, 0.1)
    .onChange(() => light.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(light.shadow.camera, 'top', 1, 5, 0.1)
    .onChange(() => light.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(light.shadow.camera, 'bottom', -5, -1, 0.1)
    .onChange(() => light.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(light.shadow.camera, 'near', 0.1, 100)
    .onChange(() => light.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(light.shadow.camera, 'far', 0.1, 100)
    .onChange(() => light.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(data, 'shadowMapSizeWidth', [256, 512, 1024, 2048, 4096])
    .onChange(() => updateShadowMapSize())
directionalLightFolder
    .add(data, 'shadowMapSizeHeight', [256, 512, 1024, 2048, 4096])
    .onChange(() => updateShadowMapSize())
directionalLightFolder.add(light.position, 'x', -5, 5, 0.01)
directionalLightFolder.add(light.position, 'y', -5, 5, 0.01)
directionalLightFolder.add(light.position, 'z', -5, 5, 0.01)
directionalLightFolder.open()

function updateShadowMapSize() {
    light.shadow.mapSize.width = data.shadowMapSizeWidth
    light.shadow.mapSize.height = data.shadowMapSizeHeight
    ;(light.shadow.map as any) = null
}

function regeneratePlaneGeometry() {
    let newGeometry = new THREE.PlaneGeometry(
        planeData.width,
        planeData.height,
        planeData.widthSegments,
        planeData.heightSegments
    )
    plane.geometry.dispose()
    plane.geometry = newGeometry
}
function updateMaterial() {
    material.side = Number(material.side) as THREE.Side
    material.needsUpdate = true
}

function animate() {
    requestAnimationFrame(animate)
    helper.update()
    controls.update()
    render()
    stats.update()
}
function render() {
    renderer.render(scene, camera)
}
animate()