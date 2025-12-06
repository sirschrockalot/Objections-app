// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Next.js server components
global.Request = class Request {
  constructor(url, init = {}) {
    // Use Object.defineProperty to set read-only properties
    const urlValue = typeof url === 'string' ? url : (url?.url || url?.toString() || 'http://localhost')
    Object.defineProperty(this, 'url', {
      value: urlValue,
      writable: false,
      configurable: true,
    })
    Object.defineProperty(this, 'method', {
      value: init.method || 'GET',
      writable: false,
      configurable: true,
    })
    this.headers = new Headers(init.headers || {})
    this._body = init.body
  }
  
  async json() {
    if (!this._body) return {}
    try {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    } catch {
      return {}
    }
  }
  
  async text() {
    return typeof this._body === 'string' ? this._body : (this._body ? JSON.stringify(this._body) : '')
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = new Map()
    if (init) {
      if (init instanceof Headers || (init.entries && typeof init.entries === 'function')) {
        // If it's already a Headers object or has entries method, copy entries
        for (const [key, value] of init.entries()) {
          this._headers.set(key.toLowerCase(), value)
        }
      } else if (Array.isArray(init)) {
        // Array of [key, value] pairs
        init.forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      } else {
        // Plain object
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }
    }
  }
  
  get(name) {
    return this._headers.get(name.toLowerCase()) || null
  }
  
  set(name, value) {
    this._headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this._headers.has(name.toLowerCase())
  }
  
  entries() {
    return this._headers.entries()
  }
  
  keys() {
    return this._headers.keys()
  }
  
  values() {
    return this._headers.values()
  }
  
  forEach(callback) {
    this._headers.forEach(callback)
  }
}

// Create Response class
const ResponseClass = class Response {
  constructor(body, init = {}) {
    // Store both string and parsed versions
    this._bodyString = typeof body === 'string' ? body : JSON.stringify(body)
    try {
      this._body = typeof body === 'string' ? JSON.parse(body) : body
    } catch {
      this._body = body
    }
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers || {})
    this.ok = this.status >= 200 && this.status < 300
  }
  
  async json() {
    return this._body
  }
  
  async text() {
    return this._bodyString
  }
  
  clone() {
    const cloned = new ResponseClass(this._bodyString, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    })
    cloned._body = this._body
    return cloned
  }
}

// Add static json method for NextResponse compatibility
// NextResponse.json calls Response.json internally, then wraps it
// We need to ensure the response's json() method returns the original body
ResponseClass.json = function(body, init = {}) {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
  const response = new ResponseClass(bodyString, init)
  // Store original body and override json() to return it
  response._body = typeof body === 'object' ? body : (bodyString ? JSON.parse(bodyString) : {})
  response.json = async function() {
    return this._body || {}
  }
  return response
}

global.Response = ResponseClass

// Mock NextResponse to use our Response mock
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: class NextResponse extends ResponseClass {
      static json(body, init = {}) {
        return ResponseClass.json(body, init);
      }
      static redirect(url, status = 307) {
        return new ResponseClass(null, { status, headers: { Location: url } });
      }
      static next(init = {}) {
        return new ResponseClass(null, init);
      }
    },
    NextRequest: class NextRequest extends global.Request {
      constructor(url, init = {}) {
        super(url, init);
      }
    },
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock mongoose and mongodb to prevent ES module parsing issues
jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    connection: {
      readyState: 0,
    },
    Schema: jest.fn(),
    model: jest.fn(),
  },
  Schema: jest.fn(),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn((id) => id || 'mock-id'),
  },
}))

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}))


