use candid::Principal;

use crate::error::GenericError;
use crate::global_state::{ORGANIZATIONS, USERS};
use crate::models::Organization;

pub fn authorize_user_organization(user_id: Principal, org_id: Principal) -> Result<Organization, GenericError> {
    let users = USERS.lock().unwrap();
    let user = users.get(&user_id);
    if user.is_none() {
        return Err(GenericError { message: "Invalid user!".to_string(), ..Default::default() })
    }
    let organizations = ORGANIZATIONS.lock().unwrap();
    let organization = organizations.get(&org_id);
    if organization.is_none() {
        return Err(GenericError { message: "Invalid organization!".to_string(), ..Default::default() })
    }

    if user.unwrap().org_ids.contains(&org_id) {
        Ok(organization.unwrap().clone())
    } else {
        Err(GenericError { message: "User is unauthorized!".to_string(), ..Default::default() })
    }
}