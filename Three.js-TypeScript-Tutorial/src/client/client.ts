import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import TWEEN from '@tweenjs/tween.js'

const elem = document.getElementById('locationData') as HTMLDivElement
const coordinate = { lat: -41.5, lon: 146.5 }

const scene = new THREE.Scene()

new RGBELoader().load(
    './img/kloppenheim_06_puresky_1k.hdr',
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
        scene.environment = texture
    }
)

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 60, 100)

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI / 2.1
controls.maxDistance = 200
controls.minDistance = 1
controls.target.set(8, 2, 28)

const geometry = new THREE.PlaneGeometry(180, 180, 720, 720).rotateX(
    -Math.PI * 0.5
)
const material = new THREE.MeshStandardMaterial({})
const ground = new THREE.Mesh(geometry, material)
scene.add(ground)

const textureLoader = new THREE.TextureLoader()

const texture = textureLoader.load('img/world.topo.bathy_tasmania.jpg')
material.map = texture
material.flatShading = true

textureLoader.load('img/gebco_tasmania.png', function (texture) {
    /* Displacing in the Vertex Shader */
    // material.displacementMap = texture
    // material.displacementScale = 100
    // material.displacementBias = -50
    /* End Displacing in the Vertex Shader */

    /* Displacing in the Javascript Layer */
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    canvas.width = texture.image.width
    canvas.height = texture.image.height
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    context.drawImage(texture.image, 0, 0)

    const width = geometry.parameters.widthSegments + 1
    const height = geometry.parameters.heightSegments + 1
    const widthStep = texture.image.width / width
    const heightStep = texture.image.height / height

    const data = context.getImageData(
        0,
        0,
        texture.image.width,
        texture.image.height
    )

    const positions = geometry.attributes.position.array
    let w, h, x, y

    for (let i = 0; i < positions.length; i += 3) {
        w = (i / 3) % width
        h = i / 3 / width

        x = Math.round(w * widthStep)
        y = Math.round(h * heightStep)

        const displacement = data.data[x * 4 + y * 4 * texture.image.width]
        positions[i + 1] = displacement / 2.55 - 50
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
    /* End Displacing in the Javascript Layer  */
})

const seaPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180, 1, 1),
    new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.25,
        metalness: 0.99,
        roughness: 0.01,
    })
)
seaPlane.rotateX(-Math.PI / 2)
scene.add(seaPlane)

const points = []
points.push(new THREE.Vector3(-90, 0, 0))
points.push(new THREE.Vector3(90, 0, 0))
const latLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
)
scene.add(latLine)

const lonLine = latLine.clone()
lonLine.rotateY(Math.PI / 2)
scene.add(lonLine)

const altLine = latLine.clone()
altLine.rotateZ(Math.PI / 2)
scene.add(altLine)

const mouse = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

function onDoubleClick(event: MouseEvent) {
    mouse.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(ground, false)
    if (intersects.length > 0) {
        const { point, uv } = intersects[0]

        new TWEEN.Tween(controls.target)
            .to(
                {
                    x: point.x,
                    y: point.y,
                    z: point.z,
                },
                500
            )
            .easing(TWEEN.Easing.Cubic.Out)
            .start()

        new TWEEN.Tween(latLine.position)
            .to(
                {
                    y: point.y,
                    z: point.z,
                },
                500
            )
            .easing(TWEEN.Easing.Cubic.Out)
            .start()

        new TWEEN.Tween(lonLine.position)
            .to(
                {
                    x: point.x,
                    y: point.y,
                },
                500
            )
            .easing(TWEEN.Easing.Cubic.Out)
            .start()

        new TWEEN.Tween(altLine.position)
            .to(
                {
                    x: point.x,
                    y: point.y,
                    z: point.z,
                },
                500
            )
            .easing(TWEEN.Easing.Cubic.Out)
            .start()

        new TWEEN.Tween(coordinate)
            .to(
                {
                    lat: -38.0 - (1 - (uv as THREE.Vector2).y) * 7,
                    lon: 143.0 + (uv as THREE.Vector2).x * 7,
                },
                500
            )
            .start()
            .onUpdate(function () {
                elem.innerText =
                    coordinate.lat.toFixed(6) + ' ' + coordinate.lon.toFixed(6)
            })
    }
}
renderer.domElement.addEventListener('dblclick', onDoubleClick, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
window.addEventListener('resize', onWindowResize, false)

const stats = new Stats()
document.body.appendChild(stats.dom)

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    TWEEN.update()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()