import { useState, useRef, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import { Counter } from './contracts/counter';
import { SensiletSigner, ScryptProvider, Scrypt, ContractCalledEvent } from 'scrypt-ts';

const contractId = {
  txId: 'fdc5218259b0d8b2127873537339d58b7c8c1e19f0859b6bc3d3549d48d64a3c',
  outputIndex: 0,
}

function App() {

  const [instance, setInstance] = useState<Counter | null>(null)
  const signerRef = useRef(new SensiletSigner(new ScryptProvider()))

  async function fetchInstance() {
    try {
      const counter = await Scrypt.contractApi.getLatestInstance(Counter, contractId)
      setInstance(counter)
    } catch (e: any) {
      console.log(`Fetch instance error: ${e}`)
    }
  }

  useEffect(() => {
    fetchInstance()
    const subscription = Scrypt.contractApi.subscribe({
      clazz: Counter,
      id: contractId,
    }, (event: ContractCalledEvent<Counter>) => {
      const txId = event.tx.id
      console.log(`Counter increment: ${txId}`)
      setInstance(event.nexts[0])
    })
    return () => { subscription.unsubscribe() }
  }, [])

  async function increment() {
    const signer = signerRef.current as SensiletSigner
    if (instance && signer) {
      const { isAuthenticated, error } = await signer.requestAuth()
      if (!isAuthenticated) {
        throw new Error(error)
      }
      await instance.connect(signer)

      const nextInstance = instance.next()
      nextInstance.count++

      instance.methods.increment({
        next: {
          instance: nextInstance,
          balance: instance.balance
        }
      }).catch(e => {
        console.log(`Counter call error: ${e}`)
        fetchInstance()
      })
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <h1>Counter now is {instance?.count.toString()}</h1>
        <button onClick={increment}>Increment</button>
      </header>
    </div>
  );
}

export default App;
