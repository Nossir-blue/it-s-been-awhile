import { useState, useEffect } from 'react'
import { Search, ShoppingCart, TrendingDown, Store, Package, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import './App.css'

const API_BASE_URL = 'http://localhost:3000/api'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [stores, setStores] = useState([])

  useEffect(() => {
    fetchStats()
    fetchStores()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/stores`)
      const data = await response.json()
      setStores(data)
    } catch (error) {
      console.error('Erro ao buscar lojas:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      setSearchResults(data.products || [])
    } catch (error) {
      console.error('Erro na busca:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async (productName) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/products/compare/${encodeURIComponent(productName)}`)
      const data = await response.json()
      setComparison(data)
    } catch (error) {
      console.error('Erro na comparação:', error)
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price, currency = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Comparador de Preços Angola</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Store className="h-4 w-4" />
                <span>{stores.length} Lojas</span>
              </Badge>
              {stats && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>{stats.totalProducts} Produtos</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Buscar Produtos</span>
              </CardTitle>
              <CardDescription>
                Encontre os melhores preços de produtos alimentícios em Angola
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite o nome do produto (ex: arroz, feijão, açúcar...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Resultados da Busca</TabsTrigger>
            <TabsTrigger value="comparison">Comparação de Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            {searchResults.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((product, index) => (
                  <Card key={index} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                        <Badge variant="outline">{product.store}</Badge>
                      </div>
                      {product.brand && (
                        <CardDescription>{product.brand}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <Badge variant={product.inStock ? "default" : "destructive"}>
                          {product.inStock ? "Em Stock" : "Esgotado"}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCompare(product.name)}
                        className="w-full"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Comparar Preços
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum produto encontrado. Tente outro termo de busca.' : 'Digite um produto para começar a busca.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {comparison ? (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5" />
                      <span>Comparação: {comparison.productName}</span>
                    </CardTitle>
                    <CardDescription>
                      Encontrado em {comparison.totalStores} loja(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-2">Menor Preço</h3>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(comparison.lowestPrice.price, comparison.lowestPrice.currency)}
                        </p>
                        <p className="text-sm text-green-700">{comparison.lowestPrice.store}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h3 className="font-semibold text-red-800 mb-2">Maior Preço</h3>
                        <p className="text-2xl font-bold text-red-600">
                          {formatPrice(comparison.highestPrice.price, comparison.highestPrice.currency)}
                        </p>
                        <p className="text-sm text-red-700">{comparison.highestPrice.store}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {comparison.allStores.map((product, index) => (
                    <Card key={index} className="bg-white/80 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{product.store}</CardTitle>
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800">Melhor Preço</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {formatPrice(product.price, product.currency)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Selecione um produto para ver a comparação de preços entre lojas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500">
            <p>© 2025 Comparador de Preços Angola. Todos os direitos reservados.</p>
            <p className="text-sm mt-1">
              Dados atualizados automaticamente. Última atualização: {stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('pt-AO') : 'N/A'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

