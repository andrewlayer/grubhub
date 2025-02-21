import { BEARER_TOKEN, COOKIE, PERIMETER_X, getPoint } from './config';
import { randomUUID } from 'crypto';
import { geocodeAddress } from './services/geocoding';

export interface CartItemRequest {
    menu_item_id: string;
    restaurant_id: string;
    quantity: number;
    special_instructions: string;
}

export interface CartItemResponse {
    status: number;
    ok: boolean;
    cart_id: string;
    checkout_token: string;
    data: any;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    diner_total: number;
    options: Array<{
        name: string;
        price: number;
    }>;
}

export interface SimplifiedCart {
    cartId: string;
    items: CartItem[];
}

export interface SimplifiedCartsResponse {
    carts: SimplifiedCart[];
}

export interface CartCreationRequest {
    brand: string;
    experiments: string[];
    cart_attributes: any[];
}

export interface CartCreationResponse {
    id: string;
    uri: string;
    already_exists: boolean;
}

export interface RestaurantItem {
    item_name: string;
    item_description: string;
    item_id: string;
}

export interface RestaurantItemsResponse {
    items: RestaurantItem[];
}

export interface DeliveryAddress {
    address_lines: string[];
    coordinates: {
        latitude: string;
        longitude: string;
    };
    administrative_area: string;
    locality: string;
    postal_code: string;
    region_code: string;
}

export interface DeliveryInfo {
    address: DeliveryAddress;
    green_indicated: boolean;
    delivery_eta_type: string;
    handoff_options: string[];
    delivery_instructions: string;
    name: string;
    email: string;
    phone: string;
}

interface BillApiResponse {
    charges: {
        diner_subtotal: number;
        diner_grand_total: number;
        fees: {
            total: number;
            delivery: number;
            service: number;
            fee_items: Array<{
                calculated_amount: number;
                type: string;
                name: string;
            }>;
        };
        taxes: {
            total: number;
        };
        tip: {
            amount: number;
        };
    };
    checkout_token: string | null;
}

export interface BillResponse {
    total: number;
    subtotal: number;
    tax: number;
    delivery_fee: number;
    tip: number;
    service_fee: number;
    small_order_fee?: number;
    ready: boolean;
    checkout_token: string | null;
}

interface RestaurantApiResponse {
    object: {
        data: {
            content: Array<{
                entity: {
                    item_name: string;
                    item_description: string;
                    item_id: string;
                }
            }>
        }
    }
}

interface PaymentInfo {
    type: string;
    payment_id: string;
}

interface SessionResponse {
    credential: {
        ud_id: string;
    };
}

interface FavoriteRestaurantsResponse {
    favorite_restaurants: Array<{
        restaurant_id: string;
        create_time: number;
    }>;
}

interface RestaurantDetailsResponse {
    restaurant_id: string;
    chain: {
        name: string;
    };
    cuisine_links: Array<{
        cuisine_name: string;
    }>;
}

interface RestaurantAvailabilityResponse {
    availability_summaries: Array<{
        restaurant_id: string;
        restaurant_name: string;
    }>;
}

export interface Restaurant {
    id: string;
    name: string;
}

interface CheckoutResponse {
    id: string;
    order_number: string;
    state: string;
    status: string;
    ordering_info: {
        eta: string;
        estimate_range: {
            minimum: number;
            maximum: number;
        };
    };
}

export class GrubhubClient {
    private static readonly BASE_URL = 'https://api-gtm.grubhub.com';
    private static readonly DEFAULT_HEADERS = {
        'sec-ch-ua-platform': '"macOS"',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Cache-Control': 'no-cache',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'If-Modified-Since': '0',
        'Content-type': 'application/json;charset=UTF-8',
        'perimeter-x': PERIMETER_X,
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'host': 'api-gtm.grubhub.com',
        'Cookie': COOKIE
    } as const;

    async addItemToCart(cartId: string | undefined, itemDetails: CartItemRequest): Promise<CartItemResponse> {
        try {
            // Create new cart if no cartId provided
            const actualCartId = cartId || (await this.createCart()).id;

            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/${actualCartId}/lines`,
                {
                    method: 'POST',
                    headers: GrubhubClient.DEFAULT_HEADERS,
                    body: JSON.stringify(itemDetails)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add item to cart: ${response.status} --> ${errorText}`);
            }

            const data = await response.json();
            return {
                status: response.status,
                ok: response.ok,
                cart_id: actualCartId,
                checkout_token: "",
                data: data as any
            };
        } catch (error) {
            console.error('Error adding item to cart:', error);
            throw error;
        }
    }

    async getCarts(): Promise<SimplifiedCartsResponse> {
        try {
            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/`,
                {
                    method: 'GET',
                    headers: GrubhubClient.DEFAULT_HEADERS
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get carts: ${response.status}`);
            }

            const data = await response.json() as { carts: Record<string, any> };
            const simplifiedCarts = Object.entries(data.carts).map(([cartId, cart]: [string, any]) => ({
                cartId,
                items: cart.charges?.lines?.line_items ?? []
            }));

            return { carts: simplifiedCarts };
        } catch (error) {
            console.error('Error getting carts:', error);
            throw error;
        }
    }

    async createCart(): Promise<CartCreationResponse> {
        try {
            const requestBody: CartCreationRequest = {
                brand: "GRUBHUB",
                experiments: [
                    "IGNORE_MINIMUM_TIP_REQUIREMENT",
                    "LINEOPTION_ENHANCEMENTS"
                ],
                cart_attributes: []
            };

            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts`,
                {
                    method: 'POST',
                    headers: GrubhubClient.DEFAULT_HEADERS,
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create cart: ${response.status}`);
            }

            return await response.json() as CartCreationResponse;
        } catch (error) {
            console.error('Error creating cart:', error);
            throw error;
        }
    }

    async getRestaurantItems(restaurantId: string): Promise<RestaurantItemsResponse> {
        try {
            const point = await getPoint();
            const baseUrl = `${GrubhubClient.BASE_URL}/restaurant_gateway/feed/${restaurantId}/None`;
            const params = new URLSearchParams({
                time: Date.now().toString(),
                location: point,
                operationId: randomUUID(),
                isFutureOrder: 'false',
                restaurantStatus: 'ORDERABLE',
                isNonRestaurantMerchant: 'false',
                task: 'POPULAR_ITEMS',
                platform: 'WEB',
                pageSize: '100'
            });

            const response = await fetch(
                `${baseUrl}?${params.toString()}`,
                {
                    method: 'GET',
                    headers: GrubhubClient.DEFAULT_HEADERS
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get restaurant items: ${response.status}`);
            }

            const data = await response.json() as RestaurantApiResponse;
            const items = data.object.data.content.map((item: any) => ({
                item_name: item.entity.item_name,
                item_description: item.entity.item_description,
                item_id: item.entity.item_id
            }));

            return { items };
        } catch (error) {
            console.error('Error getting restaurant items:', error);
            throw error;
        }
    }

    private async updatePayment(cartId: string): Promise<void> {
        try {
            const paymentInfo: PaymentInfo = {
                type: "CREDIT_CARD",
                payment_id: "RwI5OTwxQdeagGj7pkvclA"
            };

            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/${cartId}/payments`,
                {
                    method: 'POST',
                    headers: GrubhubClient.DEFAULT_HEADERS,
                    body: JSON.stringify(paymentInfo)
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Payment Response:', errorData);
                throw new Error(`Failed to update payment info: ${response.status}. ${errorData}`);
            }
        } catch (error) {
            console.error('Error updating payment info:', error);
            throw error;
        }
    }

    async updateDeliveryInfo(cartId: string, params: {
        address_lines: string[];
        city: string;
        state: string;
        zip: string;
    }): Promise<void> {
        try {
            // Get coordinates for the full address
            const fullAddress = `${params.address_lines.join(', ')}, ${params.city} ${params.state} ${params.zip}`;
            const coordinates = await geocodeAddress(fullAddress);

            const deliveryInfo = {
                address: {
                    region_code: "US",
                    address_lines: params.address_lines,
                    coordinates: {
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude
                    },
                    administrative_area: params.state,
                    locality: params.city,
                    postal_code: params.zip
                },
                green_indicated: false,
                delivery_eta_type: "STANDARD_DELIVERY",
                handoff_options: [],
                delivery_instructions: "",
                name: "Andrew Hamilton",
                email: "handrew881@gmail.com",
                phone: "(216) 312-6704"
            };

            console.log('Sending delivery info:', JSON.stringify(deliveryInfo, null, 2));

            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/${cartId}/delivery_info`,
                {
                    method: 'PUT',
                    headers: GrubhubClient.DEFAULT_HEADERS,
                    body: JSON.stringify(deliveryInfo)
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Response:', errorData);
                throw new Error(`Failed to update delivery info: ${response.status}. ${errorData}`);
            }

            // Add payment info after successful delivery info update
            await this.updatePayment(cartId);
        } catch (error) {
            console.error('Error updating delivery info:', error);
            throw error;
        }
    }

    async getBill(cartId: string): Promise<BillResponse> {
        try {
            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/${cartId}/bill`,
                {
                    method: 'GET',
                    headers: GrubhubClient.DEFAULT_HEADERS
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get bill: ${response.status}`);
            }

            const data = await response.json() as BillApiResponse;
            const obj = {
                total: data.charges.diner_grand_total / 100,
                subtotal: data.charges.diner_subtotal / 100,
                tax: data.charges.taxes.total / 100,
                delivery_fee: data.charges.fees.delivery / 100,
                tip: data.charges.tip.amount / 100,
                service_fee: data.charges.fees.service / 100,
                small_order_fee: data.charges.fees.fee_items.find(f => f.type === 'CHAIN_SMALL_ORDER_FEE')?.calculated_amount 
                    ? data.charges.fees.fee_items.find(f => f.type === 'CHAIN_SMALL_ORDER_FEE')!.calculated_amount / 100 
                    : undefined,
                ready: data.checkout_token !== null,
                checkout_token: data.checkout_token
            };

            return obj;
        } catch (error) {
            console.error('Error getting bill:', error);
            throw error;
        }
    }

    async listRestaurants(): Promise<Restaurant[]> {
        try {
            // Step 1: Get session info
            const sessionResponse = await fetch(
                `${GrubhubClient.BASE_URL}/session`,
                {
                    method: 'GET',
                    headers: GrubhubClient.DEFAULT_HEADERS
                }
            );

            if (!sessionResponse.ok) {
                throw new Error(`Failed to get session: ${sessionResponse.status}`);
            }

            const sessionText = await sessionResponse.text();
            console.log('Session response:', sessionText);

            let sessionData;
            try {
                sessionData = JSON.parse(sessionText) as SessionResponse;
            } catch (e) {
                throw new Error(`Invalid session response: ${sessionText}`);
            }

            if (!sessionData?.credential?.ud_id) {
                throw new Error('Session response missing user ID');
            }

            const userId = sessionData.credential.ud_id;

            // Step 2: Get favorite restaurants
            const favoritesResponse = await fetch(
                `${GrubhubClient.BASE_URL}/diners/${userId}/favorites/restaurants`,
                {
                    method: 'GET',
                    headers: GrubhubClient.DEFAULT_HEADERS
                }
            );

            if (!favoritesResponse.ok) {
                throw new Error(`Failed to get favorites: ${favoritesResponse.status}`);
            }

            const favoritesData = await favoritesResponse.json() as FavoriteRestaurantsResponse;

            // Step 3: Get details for each restaurant
            const point = await getPoint();
            const restaurants = await Promise.all(
                favoritesData.favorite_restaurants.map(async (fav) => {
                    const detailsResponse = await fetch(
                        `${GrubhubClient.BASE_URL}/restaurants/availability_summaries?location=${point}&includeImages=true&ids=${fav.restaurant_id}%3Astandard`,
                        {
                            method: 'GET',
                            headers: GrubhubClient.DEFAULT_HEADERS
                        }
                    );
                    const details = await detailsResponse.json() as RestaurantAvailabilityResponse;
                    return {
                        id: fav.restaurant_id,
                        name: details.availability_summaries[0]?.restaurant_name || 'Unknown Restaurant'
                    };
                })
            );

            return restaurants;
        } catch (error) {
            console.error('Error listing restaurants:', error);
            throw error;
        }
    }

    async checkoutCart(cartId: string, checkoutToken: string): Promise<CheckoutResponse> {
        try {
            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/${cartId}/checkout`,
                {
                    method: 'POST',
                    headers: GrubhubClient.DEFAULT_HEADERS,
                    body: JSON.stringify({ checkout_token: checkoutToken })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to checkout cart: ${response.status}`);
            }

            return await response.json() as CheckoutResponse;
        } catch (error) {
            console.error('Error checking out cart:', error);
            throw error;
        }
    }

    async deleteCart(cartId: string): Promise<void> {
        try {
            const response = await fetch(
                `${GrubhubClient.BASE_URL}/carts/${cartId}`,
                {
                    method: 'DELETE',
                    headers: GrubhubClient.DEFAULT_HEADERS
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete cart: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting cart:', error);
            throw error;
        }
    }
}

export const grubhubClient = new GrubhubClient(); 