export const idlFactory = ({ IDL }) => {
  const Metadata = IDL.Record({ 'key' : IDL.Text, 'value' : IDL.Text });
  const OrganizationInput = IDL.Record({
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const OrganizationPublic = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
  });
  const ResponseMetadata = IDL.Record({
    'request_id' : IDL.Opt(IDL.Text),
    'version' : IDL.Text,
    'timestamp' : IDL.Nat64,
  });
  const OrganizationResponse = IDL.Record({
    'organization' : OrganizationPublic,
  });
  const ErrorDetails = IDL.Record({
    'message' : IDL.Text,
    'details' : IDL.Vec(Metadata),
  });
  const ApiError = IDL.Variant({
    'InvalidInput' : IDL.Record({ 'details' : ErrorDetails }),
    'NotFound' : IDL.Record({ 'details' : ErrorDetails }),
    'ExternalApiError' : IDL.Record({ 'details' : ErrorDetails }),
    'Unauthorized' : IDL.Record({ 'details' : ErrorDetails }),
    'AlreadyExists' : IDL.Record({ 'details' : ErrorDetails }),
    'MalformedData' : IDL.Record({ 'details' : ErrorDetails }),
    'InternalError' : IDL.Record({ 'details' : ErrorDetails }),
  });
  const ApiResponse = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(OrganizationResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ProductInput = IDL.Record({
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'description' : IDL.Text,
    'category' : IDL.Text,
  });
  const Product = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'public_key' : IDL.Text,
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'category' : IDL.Text,
  });
  const ProductResult = IDL.Variant({
    'none' : IDL.Null,
    'error' : ApiError,
    'product' : Product,
  });
  const ProductSerialNumber = IDL.Record({
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'product_id' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'print_version' : IDL.Nat8,
    'user_serial_no' : IDL.Text,
    'serial_no' : IDL.Principal,
  });
  const ProductSerialNumberResult = IDL.Variant({
    'result' : ProductSerialNumber,
    'error' : ApiError,
  });
  const UserDetailsInput = IDL.Record({
    'email' : IDL.Text,
    'first_name' : IDL.Text,
    'detail_meta' : IDL.Vec(Metadata),
    'last_name' : IDL.Text,
    'phone_no' : IDL.Text,
  });
  const UserRole = IDL.Variant({
    'Reseller' : IDL.Null,
    'Admin' : IDL.Null,
    'BrandOwner' : IDL.Null,
  });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'user_role' : IDL.Opt(UserRole),
    'org_ids' : IDL.Vec(IDL.Principal),
    'is_principal' : IDL.Bool,
    'is_enabled' : IDL.Bool,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'email' : IDL.Opt(IDL.Text),
    'first_name' : IDL.Opt(IDL.Text),
    'detail_meta' : IDL.Vec(Metadata),
    'last_name' : IDL.Opt(IDL.Text),
    'phone_no' : IDL.Opt(IDL.Text),
  });
  const UserResult = IDL.Variant({
    'none' : IDL.Null,
    'user' : User,
    'error' : ApiError,
  });
  const Reseller = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'ecommerce_urls' : IDL.Vec(Metadata),
    'public_key' : IDL.Text,
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'date_joined' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
  });
  const ProductResponse = IDL.Record({ 'product' : Product });
  const ApiResponse_1 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ProductResponse),
    'error' : IDL.Opt(ApiError),
  });
  const GenerateResellerUniqueCodeRequest = IDL.Record({
    'context' : IDL.Opt(IDL.Text),
    'reseller_id' : IDL.Principal,
  });
  const ResellerUniqueCodeResponse = IDL.Record({
    'context' : IDL.Opt(IDL.Text),
    'unique_code' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'reseller_id' : IDL.Principal,
  });
  const ApiResponse_2 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ResellerUniqueCodeResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ApiResponse_3 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(IDL.Text),
    'error' : IDL.Opt(ApiError),
  });
  const OrganizationResult = IDL.Variant({
    'error' : ApiError,
    'organization' : OrganizationPublic,
  });
  const PrivateKeyResult = IDL.Variant({
    'key' : IDL.Text,
    'error' : ApiError,
  });
  const RateLimitInfo = IDL.Record({
    'current_window_start' : IDL.Nat64,
    'remaining_attempts' : IDL.Nat32,
    'reset_time' : IDL.Nat64,
  });
  const ApiResponse_4 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(RateLimitInfo),
    'error' : IDL.Opt(ApiError),
  });
  const PaginationRequest = IDL.Record({
    'page' : IDL.Opt(IDL.Nat32),
    'limit' : IDL.Opt(IDL.Nat32),
  });
  const FindOrganizationsRequest = IDL.Record({
    'pagination' : IDL.Opt(PaginationRequest),
    'name' : IDL.Text,
  });
  const PaginationResponse = IDL.Record({
    'total' : IDL.Nat64,
    'page' : IDL.Nat32,
    'limit' : IDL.Nat32,
    'has_more' : IDL.Bool,
  });
  const OrganizationsListResponse = IDL.Record({
    'pagination' : IDL.Opt(PaginationResponse),
    'organizations' : IDL.Vec(OrganizationPublic),
  });
  const ApiResponse_5 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(OrganizationsListResponse),
    'error' : IDL.Opt(ApiError),
  });
  const Result = IDL.Variant({
    'Ok' : IDL.Vec(ProductSerialNumber),
    'Err' : ApiError,
  });
  const ProductVerificationDetail = IDL.Record({
    'user_email' : IDL.Opt(IDL.Text),
    'product_id' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'product_name' : IDL.Text,
    'serial_no' : IDL.Principal,
  });
  const ProductUniqueCodeResultRecord = IDL.Record({
    'product_id' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'print_version' : IDL.Nat8,
    'unique_code' : IDL.Text,
    'serial_no' : IDL.Principal,
  });
  const ProductUniqueCodeResult = IDL.Variant({
    'result' : ProductUniqueCodeResultRecord,
    'error' : ApiError,
  });
  const ResellerInput = IDL.Record({
    'ecommerce_urls' : IDL.Vec(Metadata),
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
  });
  const UserResponse = IDL.Record({ 'user' : User });
  const ApiResponse_6 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(UserResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ApiResponse_7 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(IDL.Null),
    'error' : IDL.Opt(ApiError),
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  const UpdateOrganizationRequest = IDL.Record({
    'id' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const VerifyProductEnhancedRequest = IDL.Record({
    'product_id' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'print_version' : IDL.Nat8,
    'nonce' : IDL.Opt(IDL.Text),
    'unique_code' : IDL.Text,
    'timestamp' : IDL.Opt(IDL.Nat64),
    'serial_no' : IDL.Principal,
  });
  const ProductVerificationStatus = IDL.Variant({
    'Invalid' : IDL.Null,
    'MultipleVerification' : IDL.Null,
    'FirstVerification' : IDL.Null,
  });
  const VerificationRewards = IDL.Record({
    'special_reward' : IDL.Opt(IDL.Text),
    'reward_description' : IDL.Opt(IDL.Text),
    'is_first_verification' : IDL.Bool,
    'points' : IDL.Nat32,
  });
  const ProductVerification = IDL.Record({
    'id' : IDL.Principal,
    'status' : ProductVerificationStatus,
    'product_id' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'print_version' : IDL.Nat8,
    'serial_no' : IDL.Principal,
  });
  const ProductVerificationEnhancedResponse = IDL.Record({
    'status' : ProductVerificationStatus,
    'expiration' : IDL.Opt(IDL.Nat64),
    'rewards' : IDL.Opt(VerificationRewards),
    'verification' : IDL.Opt(ProductVerification),
  });
  const ApiResponse_8 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ProductVerificationEnhancedResponse),
    'error' : IDL.Opt(ApiError),
  });
  const VerifyResellerRequest = IDL.Record({
    'context' : IDL.Opt(IDL.Text),
    'unique_code' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'reseller_id' : IDL.Principal,
  });
  const ResellerVerificationStatus = IDL.Variant({
    'ExpiredCode' : IDL.Null,
    'Success' : IDL.Null,
    'ReplayAttackDetected' : IDL.Null,
    'InvalidCode' : IDL.Null,
    'OrganizationNotFound' : IDL.Null,
    'InternalError' : IDL.Null,
    'ResellerNotFound' : IDL.Null,
  });
  const ResellerVerificationResponse = IDL.Record({
    'status' : ResellerVerificationStatus,
    'reseller' : IDL.Opt(Reseller),
    'organization' : IDL.Opt(OrganizationPublic),
  });
  const ApiResponse_9 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ResellerVerificationResponse),
    'error' : IDL.Opt(ApiError),
  });
  return IDL.Service({
    'create_organization' : IDL.Func(
        [OrganizationInput],
        [OrganizationPublic],
        [],
      ),
    'create_organization_v2' : IDL.Func([OrganizationInput], [ApiResponse], []),
    'create_product' : IDL.Func([ProductInput], [ProductResult], []),
    'create_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Text)],
        [ProductSerialNumberResult],
        [],
      ),
    'create_user' : IDL.Func(
        [IDL.Principal, UserDetailsInput],
        [UserResult],
        [],
      ),
    'find_organizations_by_name' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(OrganizationPublic)],
        ['query'],
      ),
    'find_resellers_by_name_or_id' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Reseller)],
        ['query'],
      ),
    'generate_product_review_v2' : IDL.Func(
        [IDL.Principal],
        [ApiResponse_1],
        [],
      ),
    'generate_reseller_unique_code_v2' : IDL.Func(
        [GenerateResellerUniqueCodeRequest],
        [ApiResponse_2],
        [],
      ),
    'get_openai_api_key' : IDL.Func([], [ApiResponse_3], ['query']),
    'get_organization_by_id' : IDL.Func(
        [IDL.Principal],
        [OrganizationResult],
        ['query'],
      ),
    'get_organization_by_id_v2' : IDL.Func(
        [IDL.Principal],
        [ApiResponse],
        ['query'],
      ),
    'get_organization_private_key' : IDL.Func(
        [IDL.Principal],
        [PrivateKeyResult],
        ['query'],
      ),
    'get_product_by_id' : IDL.Func([IDL.Principal], [ProductResult], ['query']),
    'get_scraper_url' : IDL.Func([], [ApiResponse_3], ['query']),
    'get_user_by_id' : IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    'get_verification_rate_limit' : IDL.Func(
        [IDL.Principal],
        [ApiResponse_4],
        ['query'],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'list_organizations_v2' : IDL.Func(
        [FindOrganizationsRequest],
        [ApiResponse_5],
        [],
      ),
    'list_product_serial_numbers' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Opt(IDL.Principal)],
        [Result],
        ['query'],
      ),
    'list_product_verifications_by_org_id' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(ProductVerificationDetail)],
        ['query'],
      ),
    'list_products' : IDL.Func([IDL.Principal], [IDL.Vec(Product)], ['query']),
    'list_resellers_by_org_id' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(Reseller)],
        ['query'],
      ),
    'print_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [ProductUniqueCodeResult],
        [],
      ),
    'register' : IDL.Func([], [User], []),
    'register_as_organization' : IDL.Func(
        [OrganizationInput],
        [UserResult],
        [],
      ),
    'register_as_reseller_v2' : IDL.Func([ResellerInput], [ApiResponse_6], []),
    'set_openai_api_key' : IDL.Func([IDL.Text], [ApiResponse_7], []),
    'set_scraper_url' : IDL.Func([IDL.Text], [ApiResponse_7], []),
    'set_self_role' : IDL.Func([UserRole], [UserResult], []),
    'transform' : IDL.Func([TransformArgs], [HttpResponse], ['query']),
    'update_organization' : IDL.Func(
        [IDL.Principal, OrganizationInput],
        [OrganizationResult],
        [],
      ),
    'update_organization_v2' : IDL.Func(
        [UpdateOrganizationRequest],
        [ApiResponse],
        [],
      ),
    'update_product' : IDL.Func(
        [IDL.Principal, ProductInput],
        [ProductResult],
        [],
      ),
    'update_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Opt(IDL.Text)],
        [ProductSerialNumberResult],
        [],
      ),
    'update_self_details' : IDL.Func([UserDetailsInput], [UserResult], []),
    'update_user' : IDL.Func(
        [IDL.Principal, UserDetailsInput],
        [UserResult],
        [],
      ),
    'update_user_orgs' : IDL.Func(
        [IDL.Principal, IDL.Vec(IDL.Principal)],
        [UserResult],
        [],
      ),
    'verify_product_v2' : IDL.Func(
        [VerifyProductEnhancedRequest],
        [ApiResponse_8],
        [],
      ),
    'verify_reseller_v2' : IDL.Func(
        [VerifyResellerRequest],
        [ApiResponse_9],
        ['query'],
      ),
    'whoami' : IDL.Func([], [IDL.Opt(User)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
