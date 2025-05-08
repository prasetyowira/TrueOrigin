export const idlFactory = ({ IDL }) => {
  const ResponseMetadata = IDL.Record({
    'request_id' : IDL.Opt(IDL.Text),
    'version' : IDL.Text,
    'timestamp' : IDL.Nat64,
  });
  const Metadata = IDL.Record({ 'key' : IDL.Text, 'value' : IDL.Text });
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
    'data' : IDL.Opt(IDL.Bool),
    'error' : IDL.Opt(ApiError),
  });
  const CompleteResellerProfileRequest = IDL.Record({
    'ecommerce_urls' : IDL.Vec(Metadata),
    'additional_metadata' : IDL.Opt(IDL.Vec(Metadata)),
    'contact_email' : IDL.Opt(IDL.Text),
    'contact_phone' : IDL.Opt(IDL.Text),
    'target_organization_id' : IDL.Principal,
    'reseller_name' : IDL.Text,
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
  const ResellerContextDetails = IDL.Record({
    'certification_code' : IDL.Opt(IDL.Text),
    'certification_timestamp' : IDL.Opt(IDL.Nat64),
    'associated_organization' : IDL.Opt(OrganizationPublic),
    'is_profile_complete_and_verified' : IDL.Bool,
  });
  const UserRole = IDL.Variant({
    'Reseller' : IDL.Null,
    'Admin' : IDL.Null,
    'BrandOwner' : IDL.Null,
  });
  const UserPublic = IDL.Record({
    'id' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'email' : IDL.Opt(IDL.Text),
    'first_name' : IDL.Opt(IDL.Text),
    'last_name' : IDL.Opt(IDL.Text),
  });
  const BrandOwnerContextDetails = IDL.Record({
    'active_organization' : IDL.Opt(OrganizationPublic),
    'has_organizations' : IDL.Bool,
    'organizations' : IDL.Opt(IDL.Vec(OrganizationPublic)),
  });
  const AuthContextResponse = IDL.Record({
    'reseller_details' : IDL.Opt(ResellerContextDetails),
    'role' : IDL.Opt(UserRole),
    'user' : IDL.Opt(UserPublic),
    'brand_owner_details' : IDL.Opt(BrandOwnerContextDetails),
    'is_registered' : IDL.Bool,
  });
  const ApiResponse_1 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(AuthContextResponse),
    'error' : IDL.Opt(ApiError),
  });
  const OrganizationInput = IDL.Record({
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const OrganizationContextResponse = IDL.Record({
    'user_auth_context' : AuthContextResponse,
    'organization' : OrganizationPublic,
  });
  const ApiResponse_2 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(OrganizationContextResponse),
    'error' : IDL.Opt(ApiError),
  });
  const OrganizationResponse = IDL.Record({
    'organization' : OrganizationPublic,
  });
  const ApiResponse_3 = IDL.Record({
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
    'active_org_id' : IDL.Opt(IDL.Principal),
    'first_name' : IDL.Opt(IDL.Text),
    'detail_meta' : IDL.Vec(Metadata),
    'last_name' : IDL.Opt(IDL.Text),
    'phone_no' : IDL.Opt(IDL.Text),
    'session_keys' : IDL.Vec(IDL.Principal),
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
    'additional_metadata' : IDL.Opt(IDL.Vec(Metadata)),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'contact_email' : IDL.Opt(IDL.Text),
    'certification_code' : IDL.Opt(IDL.Text),
    'certification_timestamp' : IDL.Opt(IDL.Nat64),
    'date_joined' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'user_id' : IDL.Principal,
    'is_verified' : IDL.Bool,
    'contact_phone' : IDL.Opt(IDL.Text),
  });
  const ProductResponse = IDL.Record({ 'product' : Product });
  const ApiResponse_4 = IDL.Record({
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
  const ApiResponse_5 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ResellerUniqueCodeResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ApiResponse_6 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(IDL.Vec(UserRole)),
    'error' : IDL.Opt(ApiError),
  });
  const ApiResponse_7 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(IDL.Vec(OrganizationPublic)),
    'error' : IDL.Opt(ApiError),
  });
  const ResellerPublic = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'ecommerce_urls' : IDL.Vec(Metadata),
    'public_key' : IDL.Text,
    'additional_metadata' : IDL.Opt(IDL.Vec(Metadata)),
    'name' : IDL.Text,
    'contact_email' : IDL.Opt(IDL.Text),
    'certification_code' : IDL.Opt(IDL.Text),
    'certification_timestamp' : IDL.Opt(IDL.Nat64),
    'created_at' : IDL.Nat64,
    'user_id' : IDL.Principal,
    'is_verified' : IDL.Bool,
    'contact_phone' : IDL.Opt(IDL.Text),
    'organization_id' : IDL.Principal,
  });
  const ResellerCertificationPageContext = IDL.Record({
    'certification_code' : IDL.Text,
    'certification_timestamp' : IDL.Nat64,
    'reseller_profile' : ResellerPublic,
    'user_details' : UserPublic,
    'associated_organization' : OrganizationPublic,
  });
  const ApiResponse_8 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ResellerCertificationPageContext),
    'error' : IDL.Opt(ApiError),
  });
  const NavigationContextResponse = IDL.Record({
    'user_display_name' : IDL.Text,
    'user_avatar_id' : IDL.Opt(IDL.Text),
    'current_organization_name' : IDL.Opt(IDL.Text),
  });
  const ApiResponse_9 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(NavigationContextResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ApiResponse_10 = IDL.Record({
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
  const ApiResponse_11 = IDL.Record({
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
  const ApiResponse_12 = IDL.Record({
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
  const LogoutResponse = IDL.Record({
    'redirect_url' : IDL.Opt(IDL.Text),
    'message' : IDL.Text,
  });
  const ApiResponse_13 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(LogoutResponse),
    'error' : IDL.Opt(ApiError),
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
  const ApiResponse_14 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(UserResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ResetStorageResponse = IDL.Record({ 'message' : IDL.Text });
  const ApiResponse_15 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ResetStorageResponse),
    'error' : IDL.Opt(ApiError),
  });
  const ApiResponse_16 = IDL.Record({
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
    'unique_code' : IDL.Text,
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
  const ApiResponse_17 = IDL.Record({
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
  const ApiResponse_18 = IDL.Record({
    'metadata' : ResponseMetadata,
    'data' : IDL.Opt(ResellerVerificationResponse),
    'error' : IDL.Opt(ApiError),
  });
  return IDL.Service({
    'check_reseller_verification' : IDL.Func(
        [IDL.Principal],
        [ApiResponse],
        ['query'],
      ),
    'complete_reseller_profile' : IDL.Func(
        [CompleteResellerProfileRequest],
        [ApiResponse_1],
        [],
      ),
    'create_organization' : IDL.Func(
        [OrganizationInput],
        [OrganizationPublic],
        [],
      ),
    'create_organization_for_owner' : IDL.Func(
        [OrganizationInput],
        [ApiResponse_2],
        [],
      ),
    'create_organization_v2' : IDL.Func(
        [OrganizationInput],
        [ApiResponse_3],
        [],
      ),
    'create_product' : IDL.Func([ProductInput], [ProductResult], []),
    'create_product_serial_number' : IDL.Func(
        [IDL.Principal],
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
        [ApiResponse_4],
        [],
      ),
    'generate_reseller_unique_code_v2' : IDL.Func(
        [GenerateResellerUniqueCodeRequest],
        [ApiResponse_5],
        [],
      ),
    'get_auth_context' : IDL.Func([], [ApiResponse_1], ['query']),
    'get_available_roles' : IDL.Func([], [ApiResponse_6], ['query']),
    'get_my_organizations' : IDL.Func([], [ApiResponse_7], ['query']),
    'get_my_reseller_certification' : IDL.Func([], [ApiResponse_8], ['query']),
    'get_navigation_context' : IDL.Func([], [ApiResponse_9], ['query']),
    'get_openai_api_key' : IDL.Func([], [ApiResponse_10], ['query']),
    'get_organization_by_id' : IDL.Func(
        [IDL.Principal],
        [OrganizationResult],
        ['query'],
      ),
    'get_organization_by_id_v2' : IDL.Func(
        [IDL.Principal],
        [ApiResponse_3],
        ['query'],
      ),
    'get_organization_private_key' : IDL.Func(
        [IDL.Principal],
        [PrivateKeyResult],
        ['query'],
      ),
    'get_product_by_id' : IDL.Func([IDL.Principal], [ProductResult], ['query']),
    'get_scraper_url' : IDL.Func([], [ApiResponse_10], ['query']),
    'get_user_by_id' : IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    'get_verification_rate_limit' : IDL.Func(
        [IDL.Principal],
        [ApiResponse_11],
        ['query'],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'initialize_user_session' : IDL.Func(
        [IDL.Opt(UserRole)],
        [ApiResponse_1],
        [],
      ),
    'list_organizations_v2' : IDL.Func(
        [FindOrganizationsRequest],
        [ApiResponse_12],
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
    'logout_user' : IDL.Func([], [ApiResponse_13], []),
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
    'register_as_reseller_v2' : IDL.Func([ResellerInput], [ApiResponse_14], []),
    'reset_all_stable_storage' : IDL.Func([], [ApiResponse_15], []),
    'select_active_organization' : IDL.Func(
        [IDL.Principal],
        [ApiResponse_1],
        [],
      ),
    'set_openai_api_key' : IDL.Func([IDL.Text], [ApiResponse_16], []),
    'set_scraper_url' : IDL.Func([IDL.Text], [ApiResponse_16], []),
    'set_self_role' : IDL.Func([UserRole], [UserResult], []),
    'transform' : IDL.Func([TransformArgs], [HttpResponse], ['query']),
    'update_organization' : IDL.Func(
        [IDL.Principal, OrganizationInput],
        [OrganizationResult],
        [],
      ),
    'update_organization_v2' : IDL.Func(
        [UpdateOrganizationRequest],
        [ApiResponse_3],
        [],
      ),
    'update_product' : IDL.Func(
        [IDL.Principal, ProductInput],
        [ProductResult],
        [],
      ),
    'update_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Principal],
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
        [ApiResponse_17],
        [],
      ),
    'verify_reseller_v2' : IDL.Func(
        [VerifyResellerRequest],
        [ApiResponse_18],
        ['query'],
      ),
    'whoami' : IDL.Func([], [IDL.Opt(User)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
