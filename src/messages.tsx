import React from 'react';
import { Button, StyleSheet, Text, View, processColor} from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';

class Bridge {
  id: number
  handlers: Array<Function>
  ws: WebSocket

  constructor () {
    this.id = 1
    this.handlers = []

    this.ws = new WebSocket('ws://localhost:48090')

    this.ws.onopen = () => {
      console.log('opened ws')
    }

    this.ws.onmessage = this.onMessage.bind(this)
  }

  onMessage (e) {
    let msg = JSON.parse(e.data)
    let handler = this.handlers[msg.replyId]

    if (msg.replyId && handler) {
      handler(msg.response)

      setTimeout(() => {
        delete this.handlers[msg.replyId]
      })
    }
  }

  send (type: string, args?) {
    let id = this.id
    this.id++

    let msg = Object.assign({ type, id }, args || {})
    this.ws.send(JSON.stringify(msg))

    return new Promise((resolve, reject) => {
      this.handlers[id] = resolve
    })
  }

  pullMessages () {
    return this.send('pull-messages')
  }
}

let bridge = new Bridge

const Author = (props) => {
  return <Text>{ props.author.slice(0, 5) }...</Text>
}

const About = (props) => {
  return (
    <View>
      <Author author={props.message.value.author} />
      <Text>is now known as {props.message.value.content.name}</Text>
    </View>
  )
}

const Contact = (props) => {
  return (
    <View>
      <Author author={props.message.value.author} />
      <Text>is now following</Text>
      <Author author={props.message.value.content.contact} />
    </View>
  )
}

const Post = (props) => {
  return (
    <View>
      <Author author={props.message.value.author} />
      <Text>{props.message.value.content.text}</Text>
    </View>
  )
}

const Vote = (props) => {
  return (
    <View>
      <Author author={props.message.value.author} />
      <Text>voted for content {props.message.value.content.vote.link}</Text>
    </View>
  )
}

const Channel = (props) => {
  return (
    <View>
      <Author author={props.message.value.author} />
      <Text>subscribed to channel {props.message.value.content.channel}</Text>
    </View>
  )
}


export default class Messages extends React.Component<any, any> {
  constructor (props) {
    super(props);

    this.state = { messages: [] }
  }

  componentDidMount () {
    setTimeout(() => this.fetch(), 250)
  }

  async fetch () {
    let messages = await bridge.pullMessages()
    this.setState({ messages })
  }

  render() {
    let messages = this.state.messages.map(m => {
      if (!m.value.content) {
        return
      }
      switch (m.value.content.type) {
        case 'about':
          return <About key={m.key} message={m} />
        case 'contact':
          return <Contact key={m.key} message={m} />
        case 'post':
          return <Post key={m.key} message={m} />
        case 'vote':
          return <Vote key={m.key} message={m} />
        case 'channel':
          return <Channel key={m.key} message={m} />
        default:
          return
      }
    })
    
    return <View><Text>Messages</Text>{ messages }</View>;
  }
}

// styles
const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttons: {
    flexDirection: 'row',
    minHeight: 70,
    alignItems: 'stretch',
    alignSelf: 'center',
    borderWidth: 5,
  },
  button: {
    flex: 1,
    paddingVertical: 0,
  },
  greeting: {
    color: '#999',
    fontWeight: 'bold',
  },
});

