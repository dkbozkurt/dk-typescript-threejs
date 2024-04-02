import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'

function lerp(x: number, y: number, a: number): number {
    const r = (1 - a) * x + a * y
    return r < 0.001 ? 0 : r
}

class pickable extends THREE.Mesh {
    hovered = false
    clicked = false
    originalColor: THREE.Color
    colorTo = new THREE.Color(0xff2244)

    constructor(geometry: THREE.BufferGeometry, material: THREE.Material) {
        super()
        this.geometry = geometry
        this.material = material
        this.originalColor = (
            material as THREE.MeshPhysicalMaterial
        ).color.clone()
        this.castShadow = true
    }

    update(delta: number): void {
        this.rotation.x += delta
        this.rotation.y += delta
        const m = this.material as THREE.MeshPhysicalMaterial
        this.hovered
            ? (m.color.lerp(this.colorTo, 0.1),
              (m.thickness = lerp(m.thickness, 3, 0.1)),
              (m.reflectivity = lerp(m.reflectivity, 1, 0.1)),
              (m.roughness = lerp(m.roughness, 0.1, 0.1)),
              (m.clearcoat = lerp(m.clearcoat, 0.1, 0.1)),
              (m.transmission = lerp(m.transmission, 0.99, 0.1)),
              (m.ior = lerp(m.ior, 1.1, 0.1)))
            : (m.color.lerp(this.originalColor, 0.1),
              (m.thickness = lerp(m.thickness, 0, 0.1)),
              (m.reflectivity = lerp(m.reflectivity, 0, 0.1)),
              (m.roughness = lerp(m.roughness, 1.0, 0.1)),
              (m.clearcoat = lerp(m.clearcoat, 0, 0.1)),
              (m.transmission = lerp(m.transmission, 0, 0.1)),
              (m.ior = lerp(m.ior, 1.5, 0.1)))
        this.clicked
            ? this.scale.set(
                  lerp(this.scale.x, 1.5, 0.1),
                  lerp(this.scale.y, 1.5, 0.1),
                  lerp(this.scale.z, 1.5, 0.1)
              )
            : this.scale.set(
                  lerp(this.scale.x, 1.0, 0.1),
                  lerp(this.scale.y, 1.0, 0.1),
                  lerp(this.scale.z, 1.0, 0.1)
              )
    }
}

const raycaster = new THREE.Raycaster()
const pickables: pickable[] = []
let intersects: THREE.Intersection[]

const scene = new THREE.Scene()

const spotLight = new THREE.SpotLight(0xffffff, 500)
spotLight.position.set(5, 5, 5)
spotLight.angle = 0.3
spotLight.penumbra = 0.5
spotLight.castShadow = true
spotLight.shadow.mapSize.width = 512
spotLight.shadow.mapSize.height = 512
spotLight.shadow.bias = -0.001
spotLight.shadow.radius = 20
spotLight.shadow.blurSamples = 10
spotLight.shadow.camera.far = 15
scene.add(spotLight)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
)
camera.position.y = 2
camera.position.z = 4

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap
renderer.domElement.addEventListener('pointerdown', onClick, false)

document.body.appendChild(renderer.domElement)
document.addEventListener('mousemove', onDocumentMouseMove, false)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const envTexture = new THREE.CubeTextureLoader().load([
    'img/px_25.jpg',
    'img/nx_25.jpg',
    'img/py_25.jpg',
    'img/ny_25.jpg',
    'img/pz_25.jpg',
    'img/nz_25.jpg',
])
envTexture.mapping = THREE.CubeReflectionMapping
scene.environment = envTexture

const cube = new pickable(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({ color: 0xff8800 })
)
cube.position.set(-2, 0, 0)
scene.add(cube)
pickables.push(cube)

const cylinder = new pickable(
    new THREE.CylinderGeometry(0.66, 0.66),
    new THREE.MeshPhysicalMaterial({ color: 0x008800 })
)
scene.add(cylinder)
pickables.push(cylinder)

const pyramid = new pickable(
    new THREE.TetrahedronGeometry(),
    new THREE.MeshPhysicalMaterial({ color: 0x0088ff })
)
pyramid.position.set(2, 0, 0)
scene.add(pyramid)
pickables.push(pyramid)

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshPhysicalMaterial()
)
floor.rotateX(-Math.PI / 2)
floor.position.y = -1.25
floor.receiveShadow = true
scene.add(floor)

const mouse = new THREE.Vector2()
function onDocumentMouseMove(event: MouseEvent) {
    mouse.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    pickables.forEach((p) => (p.hovered = false))
    intersects = raycaster.intersectObjects(pickables, false)
    if (intersects.length) (intersects[0].object as pickable).hovered = true
}

function onClick() {
    raycaster.setFromCamera(mouse, camera)
    intersects = raycaster.intersectObjects(pickables, false)
    intersects.forEach((i) => {
        ;(i.object as pickable).clicked = !(i.object as pickable).clicked
    })
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const clock = new THREE.Clock()
let delta = 0

function render() {
    renderer.render(scene, camera)
}

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    delta = clock.getDelta()
    pickables.forEach((p) => {
        p.update(delta)
    })

    render()

    stats.update()
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
window.addEventListener('resize', onWindowResize, false)

animate()