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

const AuthorImage = (props) => {
  return (
    <View style={styles.authorImage} />
  )
}

const AuthorInline = (props) => {
  return <Text>{ props.author.slice(0, 5) }...</Text>
}

const Author = (props) => {
  return (
    <View style={styles.authorText}>
      <Text>{ props.author.slice(0, 5) }...</Text>
    </View>
  )
}

const About = (props) => {
  return (
    <View style={[styles.message, styles.about]}>
      <AuthorImage author={props.message.value.author} />

      <View style={styles.messageContent}>
        <Text>
          <AuthorInline author={props.message.value.author} /> is now known as {props.message.value.content.name}
        </Text>
      </View>
    </View>
  )
}

const Contact = (props) => {
  return (
    <View style={[styles.message, styles.contact]}>
      <AuthorImage author={props.message.value.author} />

      <View style={styles.messageContent}>
        <Text>
          <AuthorInline author={props.message.value.author} /> is now following { props.message.value.content.contact.slice(0, 5) }...
        </Text>
      </View>
    </View>
  )
}

const Post = (props) => {
  return (
    <View style={[styles.message, styles.post]}>
      <AuthorImage author={props.message.value.author} />

      <View style={styles.messageContent}>
        <Author author={props.message.value.author} />

         <Text>{props.message.value.content.text}</Text>
      </View>
    </View>
  )
}

const Vote = (props) => {
  return (
    <View style={[styles.message, styles.vote]}>
      <AuthorImage author={props.message.value.author} />

      <View style={styles.messageContent}>
        <Text>
          <AuthorInline author={props.message.value.author} /> voted for content {props.message.value.content.vote.link}
        </Text>
      </View>
    </View>
  )
}

const Channel = (props) => {
  return (
    <View style={[styles.message, styles.channel]}>
      <AuthorImage author={props.message.value.author} />

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
    
    return <View>{ messages }</View>;
  }
}

// styles
const styles = StyleSheet.create({
  about: {},
  contact: {},
  post: {},
  vote: {},
  channel: {},
  author: {
    color: '#777'
  },
  authorImage: {
    borderRadius: 100,
    width: 32,
    height: 32,
    margin: 8,
    backgroundColor: '#888',
    flex: 0
  },

  authorText: {
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#333'
  },

  message: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    flexDirection: 'row',
  },
  messageContent: {
    flex: 1
  }
});

