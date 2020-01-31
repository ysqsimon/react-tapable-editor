import { keyExtractor } from './keyExtractor'
import {
  getOffsetKey,
  getNodeByOffsetKey,
} from './utils'

class DropTarget {
  constructor(blockKey) {
    this.blockKey = blockKey
    this.offsetKey = getOffsetKey(this.blockKey)
    this.listenerKey = keyExtractor(blockKey, 'target')

    this.setup()
  }

  dragEnterHandler = e => {
    e.preventDefault()
    console.log('enter ', this.listenerKey)
  }

  dragOverHandler = e => {
    e.preventDefault()
    console.log('over ', this.listenerKey)
  }

  // https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome
  dropHandler = e => {
    console.log('drop ', this.listenerKey)
  }

  setup() {
    const node = getNodeByOffsetKey(this.offsetKey)
    node.addEventListener('dragenter', this.dragEnterHandler)
    node.addEventListener('dragover', this.dragOverHandler)
    node.addEventListener('drop', this.dropHandler)

    return () => {
      this.teardown()
    }
  }

  teardown() {
    const node = getNodeByOffsetKey(this.offsetKey)
    node.removeEventListener('dragenter', this.dragEnterHandler)
    node.removeEventListener('dragover', this.dragOverHandler)
    node.removeEventListener('drop', this.dropHandler)
  }
}

export default DropTarget