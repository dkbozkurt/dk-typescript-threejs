import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene()
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const light = new THREE.PointLight(0xffffff, 1000)
light.position.set(0, 10, 0)
scene.add(light)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 1, 1)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const planeGeometry = new THREE.PlaneGeometry(3.6, 1.8, 360, 180)

const material = new THREE.MeshPhongMaterial()

const texture = new THREE.TextureLoader().load('img/worldColour.5400x2700.jpg')
material.map = texture

const displacementMap = new THREE.TextureLoader().load(
    'img/gebco_bathy.5400x2700_8bit.jpg'
)
material.displacementMap = displacementMap
material.displacementScale = 0.3

const normalTexture = new THREE.TextureLoader().load(
    'img/earth_normalmap_8192x4096.jpg'
)
material.normalMap = normalTexture
material.normalScale.set(5, 5)

const plane = new THREE.Mesh(planeGeometry, material)
plane.rotation.x = -Math.PI / 2
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

const options = {
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
    emissive: material.emissive.getHex(),
}

const meshPhongMaterialFolder = gui.addFolder('THREE.MeshPhongMaterial')
meshPhongMaterialFolder.addColor(data, 'color').onChange(() => {
    material.color.setHex(Number(data.color.toString().replace('#', '0x')))
})
meshPhongMaterialFolder.addColor(data, 'emissive').onChange(() => {
    material.emissive.setHex(
        Number(data.emissive.toString().replace('#', '0x'))
    )
})
meshPhongMaterialFolder.add(material, 'wireframe')
meshPhongMaterialFolder
    .add(material, 'flatShading')
    .onChange(() => updateMaterial())
meshPhongMaterialFolder.add(material, 'displacementScale', -1, 1, 0.01)
meshPhongMaterialFolder.add(material, 'displacementBias', -1, 1, 0.01)
meshPhongMaterialFolder.open()

const planeData = {
    width: 3.6,
    height: 1.8,
    widthSegments: 180,
    heightSegments: 90,
}

const planePropertiesFolder = gui.addFolder('PlaneGeometry')
planePropertiesFolder
    .add(planeData, 'widthSegments', 1, 360)
    .onChange(regeneratePlaneGeometry)
planePropertiesFolder
    .add(planeData, 'heightSegments', 1, 180)
    .onChange(regeneratePlaneGeometry)
planePropertiesFolder.open()

const lightFolder = gui.addFolder('Light')
lightFolder.add(light.position, 'x', -10, 10).name('position.x')
lightFolder.add(material.normalScale, 'x', 0, 10, 0.01).name('normalScale.x')
lightFolder.add(material.normalScale, 'y', 0, 10, 0.01).name('normalScale.y')
lightFolder.open()

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
    render()
    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()