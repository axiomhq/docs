import json
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import urllib.request
import math
import logging
import base64

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    is_base64_encoded = event.get('isBase64Encoded', False)
    raw_body = event.get('body', '')
    
    if is_base64_encoded:
        # Decode the base64 body
        try:
            decoded_body = base64.b64decode(raw_body).decode('utf-8')
            logger.info(f"Decoded body: {decoded_body}")
        except Exception as e:
            logger.error(f"Failed to decode base64 body: {str(e)}")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Failed to decode request body'})
            }
    else:
        decoded_body = raw_body
        
    
    url = "https://api.voyageai.com/v1/embeddings"

    headers = {
        "Authorization": "", 
        "Content-Type": "application/json"
    }
    
    body = json.loads(decoded_body)
    
    aggregation = body['tables'][0]['fields'][-1]['agg']['name']
    new_group_name = ' '.join([item['name'] for item in body['tables'][0]['groups']])
    
    unjoined_groups = body['tables'][0]['columns'][:-1]
    groups = [', '.join(map(str, col)) for col in zip(*unjoined_groups)]
    
    values = body['tables'][0]['columns'][-1]

    group_value_lookup = {group:value for group, value in zip(groups, values)}

    embeddings = []
    
    for i in range(0, len(groups), 128):
        data = {
            "input": groups[i:i+128],
            "model": "voyage-large-2"
        }
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=json_data, headers=headers, method="POST")
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
        embeddings += [item['embedding'] for item in response_data['data']]
        
    
    best_cluster_count = 0
    best_score = -2
    best_model = None

    for n_clusters in range(2, min(12, 3 + int(len(groups)/5))):
        kmeans = KMeans(n_clusters=n_clusters)
        labels_clusters = kmeans.fit_predict(embeddings)
        
        silhouette = silhouette_score(embeddings, labels_clusters)
        if silhouette > best_score or best_model is None:
            best_score = silhouette
            best_model = kmeans
            best_cluster_count = n_clusters
    
    model = best_model
    group_names = {}
    
    for i in range(0, best_cluster_count):
        centroid = model.cluster_centers_[i]
        relevant_groups = [group for j, group in enumerate(groups) if model.labels_[j] == i]
        relevant_embeddings = [embedding for j, embedding in enumerate(embeddings) if model.labels_[j] == i]
        distances = [math.dist(embedding, centroid) for embedding in relevant_embeddings]
        nearest_index = min(enumerate(distances), key=lambda x: x[1])[0]
        group_names[i] = relevant_groups[nearest_index]

    agg_lookup = {
        "count": sum,
        "max": max,
        "min": min
    }
    aggregation_func = agg_lookup.get(aggregation, sum)
    
    new_aggregations = {
        name: aggregation_func([group_value_lookup[group] for group in [g for enum, g in enumerate(groups) if model.labels_[enum] == i]]) for i, name in group_names.items()
        }
    
    group_membership = {
        name: [g for enum, g in enumerate(groups) if model.labels_[enum] == i] for i, name in group_names.items()
    }
    
    sorted_items = sorted(new_aggregations.items(), key=lambda x: x[1], reverse=True)
    
    new_groups, new_values = zip(*sorted_items)
    
    group_membership = [group_membership[name] for name in new_groups]
    
    body['tables'][0]['columns'] = [new_groups, new_values]
    body['tables'][0]['group_membership'] = group_membership
    body['tables'][0]['groups'] = [{'name': new_group_name}]
    body['tables'][0]['fields'] = [{"name": new_group_name, "type": "string"}] + [body['tables'][0]['fields'][-1]]
    
    return {
        'statusCode': 200,
        'body': json.dumps(body)
    }
