interface PayloadDisplayProps {
  payload: any
}

export default function PayloadDisplay({ payload }: PayloadDisplayProps) {
  const formatPayload = (obj: any, depth = 0): JSX.Element => {
    if (obj === null || obj === undefined) {
      return <span style={{ color: '#666' }}>null</span>
    }

    if (typeof obj !== 'object') {
      if (typeof obj === 'string') {
        return <span style={{ color: '#0a7b00' }}>"{obj}"</span>
      }
      if (typeof obj === 'number') {
        return <span style={{ color: '#0066cc' }}>{obj}</span>
      }
      if (typeof obj === 'boolean') {
        return <span style={{ color: '#d73a49' }}>{obj.toString()}</span>
      }
      return <span>{String(obj)}</span>
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span>[]</span>
      return (
        <div style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
          [
          {obj.map((item, index) => (
            <div key={index} style={{ marginLeft: '20px' }}>
              {formatPayload(item, depth + 1)}
              {index < obj.length - 1 && ','}
            </div>
          ))}
          ]
        </div>
      )
    }

    const entries = Object.entries(obj)
    if (entries.length === 0) return <span>{'{}'}</span>

    return (
      <div style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
        {'{'}
        {entries.map(([key, value], index) => (
          <div key={key} style={{ marginLeft: '20px' }}>
            <span style={{ color: '#005cc5' }}>"{key}"</span>: {formatPayload(value, depth + 1)}
            {index < entries.length - 1 && ','}
          </div>
        ))}
        {'}'}
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '15px',
        fontSize: '14px',
        fontFamily: 'monospace',
        overflow: 'auto',
        maxHeight: '400px',
      }}
    >
      {formatPayload(payload)}
    </div>
  )
}
