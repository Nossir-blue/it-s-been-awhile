import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

class AngolaDataService:
    def __init__(self):
        self.client = ApiClient()
        self.angola_country_code = 'AGO'  
    
    def get_economic_indicators(self):
        """Obter indicadores económicos de Angola"""
        try:
            
            gdp_data = self.client.call_api('DataBank/indicator_data', query={
                'indicator': 'NY.GDP.MKTP.CD',
                'country': self.angola_country_code
            })
            
            
            inflation_data = self.client.call_api('DataBank/indicator_data', query={
                'indicator': 'FP.CPI.TOTL.ZG',
                'country': self.angola_country_code
            })
            
            
            population_data = self.client.call_api('DataBank/indicator_data', query={
                'indicator': 'SP.POP.TOTL',
                'country': self.angola_country_code
            })
            
            return {
                'gdp': gdp_data,
                'inflation': inflation_data,
                'population': population_data
            }
        except Exception as e:
            print(f"Erro ao obter indicadores económicos: {e}")
            return None
    
    def get_latest_year_data(self, data_dict):
        """Extrair dados do ano mais recente disponível"""
        if not data_dict or 'data' not in data_dict:
            return None
        
        data = data_dict['data']
        
        for year in sorted(data.keys(), reverse=True):
            if data[year] is not None:
                return {
                    'year': year,
                    'value': data[year]
                }
        return None


def get_angola_context():
    """Função principal para obter contexto de Angola"""
    service = AngolaDataService()
    indicators = service.get_economic_indicators()
    
    if not indicators:
        return None
    
    context = {}
    
    
    if indicators['gdp']:
        gdp_latest = service.get_latest_year_data(indicators['gdp'])
        if gdp_latest:
            context['gdp'] = {
                'value': gdp_latest['value'],
                'year': gdp_latest['year'],
                'formatted': f"${gdp_latest['value']:,.0f} USD ({gdp_latest['year']})"
            }
    
    
    if indicators['inflation']:
        inflation_latest = service.get_latest_year_data(indicators['inflation'])
        if inflation_latest:
            context['inflation'] = {
                'value': inflation_latest['value'],
                'year': inflation_latest['year'],
                'formatted': f"{inflation_latest['value']:.2f}% ({inflation_latest['year']})"
            }
    
    
    if indicators['population']:
        pop_latest = service.get_latest_year_data(indicators['population'])
        if pop_latest:
            context['population'] = {
                'value': pop_latest['value'],
                'year': pop_latest['year'],
                'formatted': f"{pop_latest['value']:,.0f} habitantes ({pop_latest['year']})"
            }
    
    return context

if __name__ == "__main__":
    
    context = get_angola_context()
    if context:
        print("Contexto de Angola:")
        for key, value in context.items():
            print(f"{key}: {value['formatted']}")
    else:
        print("Não foi possível obter dados de Angola")

