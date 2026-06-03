module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.32"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    core = {
      instance_types = ["t3.large"]
      min_size       = 1
      max_size       = 5
      desired_size   = 1
      capacity_type  = "ON_DEMAND"
      labels = {
        role = "core"
      }
    }
    spot = {
      instance_types = ["t3.large", "t3.xlarge", "t3a.large"]
      min_size       = 0
      max_size       = 5
      desired_size   = 0
      capacity_type  = "SPOT"
      labels = {
        role = "spot"
      }
      taints = {
        spot = {
          key    = "spot"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      }
    }
  }

  tags = {
    "karpenter.sh/discovery" = var.cluster_name
  }
}